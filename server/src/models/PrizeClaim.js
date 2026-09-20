import mongoose from "mongoose";

const s = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },

        prizeId: {
            type: String,
            required: true,
        },

        prizeName: {
            type: String,
            required: true,
        },

        prizeAmount: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "verified",
                "rejected",
            ],
            default: "pending",
        },

        claimedAt: {
            type: Date,
            default: Date.now,
        },

        verifiedAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
    },
);

s.index(
    {
        room: 1,
        prizeId: 1,
        user: 1,
    },
    {
        unique: true,
    },
);

export default mongoose.model(
    "PrizeClaim",
    s,
);