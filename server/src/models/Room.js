import mongoose from "mongoose";
const s = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, index: true },
        title: String,
        description: String,
        status: {
            type: String,
            enum: ["upcoming", "live", "closed"],
            default: "upcoming",
        },
        startsAt: Date,
        ticketPrice: { type: Number, min: 0 },
        jackpot: { type: Number, min: 0, default: 0 },
        balls: { type: Number, default: 90 },
    },
    { timestamps: true },
);
export default mongoose.model("Room", s);
