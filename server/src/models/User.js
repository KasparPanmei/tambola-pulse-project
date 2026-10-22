import mongoose from "mongoose";

const s = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            maxlength: 80,
            default: "",
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        phoneVerified: {
            type: Boolean,
            default: false,
        },

        // ADDED: Track which room this player last checked into for live admin attendance.
        roomPresenceRoom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
            index: true,
        },

        roomLastSeen: {
            type: Date,
            default: null,
            index: true,
        },

        role: {
            type: String,
            enum: ["player", "admin"],
            default: "player",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("User", s);