import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import MusicTrack from "../models/MusicTrack.js";
import Room from "../models/Room.js";

// ADDED: Admin-uploaded audio is saved on the server and referenced from the room document.
const allowedExtensions = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"]);
const musicDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../uploads/music",
);

// ADDED: Validate, store, and attach the selected local audio track to a room.
export async function uploadRoomMusic(req, res) {
    try {
        const roomCode = String(req.query.roomCode || "").trim().toUpperCase();
        const originalName = path.basename(String(req.query.fileName || "background-music"));
        const extension = path.extname(originalName).toLowerCase();
        const audio = req.body;

        if (!roomCode) return res.status(400).json({ message: "Room code is required." });
        if (!allowedExtensions.has(extension)) {
            return res.status(400).json({ message: "Choose an MP3, WAV, OGG, M4A, AAC, or WEBM audio file." });
        }
        if (!Buffer.isBuffer(audio) || audio.length === 0) {
            return res.status(400).json({ message: "The selected audio file is empty or could not be read." });
        }
        if (audio.length > 25 * 1024 * 1024) {
            return res.status(413).json({ message: "Music files must be 25 MB or smaller." });
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) return res.status(404).json({ message: `Room ${roomCode} not found.` });

        await fs.mkdir(musicDirectory, { recursive: true });
        const filename = `${crypto.randomUUID()}${extension}`;
        await fs.writeFile(path.join(musicDirectory, filename), audio, { flag: "wx" });

        // ADDED: Keep uploaded songs in the admin's reusable music library.
        const track = await MusicTrack.create({
            fileName: filename,
            title: originalName.slice(0, 120),
            url: `/media/music/${filename}`,
            fileSize: audio.length,
        });

        room.musicUrl = track.url;
        room.musicTitle = track.title;
        room.musicTrackId = track._id;
        room.musicPosition = 0;
        room.musicPlaying = false;
        room.musicUpdatedAt = new Date();
        await room.save();

        return res.status(201).json({ message: "Music uploaded to your library. Press Play to start it for the room.", room, track });
    } catch (error) {
        console.error("Upload room music error:", error);
        return res.status(500).json({ message: "Unable to upload background music." });
    }
}

// ADDED: Discover older uploaded files and return the persistent library newest-first.
export async function getMusicLibrary(req, res) {
    try {
        await fs.mkdir(musicDirectory, { recursive: true });
        const files = (await fs.readdir(musicDirectory, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase()))
            .map((entry) => entry.name);

        if (files.length === 0) return res.json({ tracks: [] });

        const [knownTracks, rooms] = await Promise.all([
            MusicTrack.find({ fileName: { $in: files } }).lean(),
            Room.find({ musicUrl: { $ne: "" } }).select("musicUrl musicTitle").lean(),
        ]);
        const knownByFileName = new Map(knownTracks.map((track) => [track.fileName, track]));
        const legacyTitlesByUrl = new Map(rooms.map((room) => [room.musicUrl, room.musicTitle]));
        const tracks = [];

        for (const fileName of files) {
            let track = knownByFileName.get(fileName);
            if (!track) {
                const filePath = path.join(musicDirectory, fileName);
                const stats = await fs.stat(filePath);
                const url = `/media/music/${fileName}`;
                // MODIFIED: Preserve the extension in legacy fallback titles to distinguish stored files.
                const fallbackTitle = path.basename(fileName);
                track = await MusicTrack.findOneAndUpdate(
                    { fileName },
                    {
                        $setOnInsert: {
                            fileName,
                            title: legacyTitlesByUrl.get(url) || fallbackTitle,
                            url,
                            fileSize: stats.size,
                        },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true },
                ).lean();
            }
            tracks.push(track);
        }

        tracks.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
        return res.json({ tracks });
    } catch (error) {
        console.error("Load music library error:", error);
        return res.status(500).json({ message: "Unable to load the music library." });
    }
}

// ADDED: Select and start a saved library track for the room.
export async function selectRoomMusic(req, res) {
    try {
        const roomCode = String(req.body.roomCode || "").trim().toUpperCase();
        const trackId = String(req.body.trackId || "");
        if (!mongoose.isValidObjectId(trackId)) return res.status(400).json({ message: "Select a valid music track." });

        const [room, track] = await Promise.all([
            Room.findOne({ code: roomCode }),
            MusicTrack.findById(trackId),
        ]);
        if (!room) return res.status(404).json({ message: `Room ${roomCode || ""} not found.` });
        if (!track) return res.status(404).json({ message: "Music track was not found in the library." });
        await fs.access(path.join(musicDirectory, track.fileName));

        room.musicUrl = track.url;
        room.musicTitle = track.title;
        room.musicTrackId = track._id;
        room.musicPosition = 0;
        room.musicPlaying = true;
        room.musicUpdatedAt = new Date();
        await room.save();
        return res.json({ message: `Now playing: ${track.title}`, room, track });
    } catch (error) {
        if (error.code === "ENOENT") return res.status(410).json({ message: "This music file is missing from server storage." });
        console.error("Select room music error:", error);
        return res.status(500).json({ message: "Unable to play the selected music track." });
    }
}

// ADDED: Publish play/pause state so the admin and player rooms stay synchronized.
export async function controlRoomMusic(req, res) {
    try {
        const roomCode = String(req.body.roomCode || "").trim().toUpperCase();
        const room = await Room.findOne({ code: roomCode });

        if (!room) return res.status(404).json({ message: `Room ${roomCode || ""} not found.` });
        const playing = typeof req.body.playing === "boolean" ? req.body.playing : Boolean(room.musicPlaying);
        if (playing && !room.musicUrl) {
            return res.status(400).json({ message: "Choose a music file before starting playback." });
        }

        const playbackChanged = room.musicPlaying !== playing;
        room.musicPlaying = playing;
        let positionChanged = false;
        // ADDED: Sync player seek and pause/resume positions across the room.
        if (req.body.currentTime !== undefined) {
            const requestedPosition = Number(req.body.currentTime);
            if (!Number.isFinite(requestedPosition) || requestedPosition < 0) {
                return res.status(400).json({ message: "Playback position must be a non-negative number." });
            }
            room.musicPosition = requestedPosition;
            positionChanged = true;
        }
        // ADDED: Store a clamped admin master volume; changing volume does not restart the music clock.
        if (req.body.volume !== undefined) {
            const requestedVolume = Number(req.body.volume);
            if (!Number.isFinite(requestedVolume)) {
                return res.status(400).json({ message: "Music volume must be a number between 0 and 1." });
            }
            room.musicVolume = Math.max(0, Math.min(1, requestedVolume));
        }
        if (playbackChanged || positionChanged || !room.musicUpdatedAt) room.musicUpdatedAt = new Date();
        await room.save();
        return res.json({ message: "Room music settings updated.", room });
    } catch (error) {
        console.error("Control room music error:", error);
        return res.status(500).json({ message: "Unable to update background music." });
    }
}
