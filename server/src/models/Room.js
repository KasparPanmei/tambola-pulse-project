import mongoose from "mongoose";

const prizeSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        shortName: {
            type: String,
            default: "",
        },
        amount: {
            type: Number,
            default: 0,
            min: 0,
        },
        reward: {
            type: String,
            default: "",
        },
        detail: {
            type: String,
            default: "",
        },
        accent: {
            type: String,
            default: "gold",
        },
        winners: {
            type: Number,
            default: 1,
            min: 1,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        // CHANGED: Store the automatic winner in the room so every player sees the same claimed state.
        claimed: {
            type: Boolean,
            default: false,
        },
        claimedByTicket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            default: null,
        },
        claimedByUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        claimedAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    },
);

const s = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        title: String,

        description: String,

        status: {
            type: String,
            enum: [
                "upcoming",
                "live",
                "paused",
                "closed",
            ],
            default: "upcoming",
        },

        startsAt: Date,

        ticketPrice: {
            type: Number,
            min: 0,
        },

        jackpot: {
            type: Number,
            min: 0,
            default: 0,
        },

        balls: {
            type: Number,
            default: 90,
        },

        prizes: {
            type: [prizeSchema],
            default: [],
        },

        currentNumber: {
            type: Number,
            default: null,
        },

        calledNumbers: {
            type: [Number],
            default: [],
        },

        callCadence: {
            type: Number,
            enum: [3, 5, 10],
            default: 5,
        },

        autoCaller: {
            type: Boolean,
            default: false,
        },

        gameStartedAt: {
            type: Date,
            default: null,
        },

        lastCalledAt: {
            type: Date,
            default: null,
        },

        gameVersion: {
            type: Number,
            default: 0,
        },

        // ADDED: Shared admin-selected audio track and playback synchronization state.
        musicUrl: {
            type: String,
            default: "",
        },

        musicTitle: {
            type: String,
            default: "",
        },

        // ADDED: Track identity and resume/seek offset shared with player clients.
        musicTrackId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MusicTrack",
            default: null,
        },

        musicPosition: {
            type: Number,
            min: 0,
            default: 0,
        },

        musicPlaying: {
            type: Boolean,
            default: false,
        },

        // ADDED: Admin master volume shared with every player in this room (0 muted to 1 full volume).
        musicVolume: {
            type: Number,
            min: 0,
            max: 1,
            default: 1,
        },

        musicUpdatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Room", s);
