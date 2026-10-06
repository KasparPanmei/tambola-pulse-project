import mongoose from "mongoose";

// ADDED: Persistent library metadata for music files uploaded through the admin dashboard.
const musicTrackSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        url: {
            type: String,
            required: true,
            unique: true,
        },
        fileSize: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true },
);

export default mongoose.model("MusicTrack", musicTrackSchema);
