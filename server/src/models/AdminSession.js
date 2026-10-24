import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        lastActivityAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        revokedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: true },
);

schema.index({ lastActivityAt: 1, revokedAt: 1 });

export default mongoose.model("AdminSession", schema);
