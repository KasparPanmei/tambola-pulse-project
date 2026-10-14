import mongoose from 'mongoose';
const s = new mongoose.Schema(
    {
        reference: { type: String, unique: true, index: true },
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
        amount: Number,
        fee: { type: Number, default: 0 },
        total: Number,
        paymentMethod: {
            type: String,
            enum: ["upi_qr", "upi_id"],
            default: "upi_qr",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "expired"],
            default: "pending",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "expired"],
            default: "pending",
        },
        upiReference: {
            type: String,
            default: "",
        },
        manualPaymentSubmitted: {
            type: Boolean,
            default: false,
        },
        paymentSubmittedAt: Date,
        paymentVerifiedAt: Date,
        paymentVerifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        paymentRejectionReason: {
            type: String,
            default: "",
        },

        ticketColor: {
            type: String,
            enum: [
                "yellow",
                "pink",
                "green",
                "blue",
                "white",
                "purple",
                "orange",
            ],
            default: "yellow",
        },

    },
    { timestamps: true }
);
export default mongoose.model('Booking', s);
