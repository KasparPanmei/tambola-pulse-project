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
        // ADDED: Group each consecutive set of six tickets into a purchasable sheet.
        sheetId: { type: String, default: null, index: true },
        // ADDED: Human-readable sheet number shown on each ticket card.
        sheetNumber: { type: Number, default: null },
        // ADDED: Persist the selected ticket paper color for checkout and live-game rendering.
        ticketColor: { type: String, enum: ["yellow", "pink", "green", "blue", "white", "purple", "orange"], default: "yellow" },
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
s.index({ room: 1, sheetId: 1, status: 1 });
export default mongoose.model("Ticket", s);
