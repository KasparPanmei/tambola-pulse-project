import mongoose from "mongoose";
const s = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },
        number: { type: Number, required: true },
        publicCode: { type: String, unique: true },
        grid: [[Number]],
        status: {
            type: String,
            enum: ["available", "held", "booked"],
            default: "available",
            index: true,
        },
        heldUntil: Date,
        heldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
        },
    },
    { timestamps: true },
);
s.index({ room: 1, number: 1 }, { unique: true });
export default mongoose.model("Ticket", s);
