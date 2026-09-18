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
            enum: ['upi_qr', 'upi_id', 'card'],
            default: 'upi_qr',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'expired'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'expired'],
            default: 'pending',
        },
        expiresAt: Date,
        upiReference: String,

        razorpayOrderId: {
            type: String,
            index: true,
        },

        razorpayPaymentId: {
            type: String,
        },
        razorpayPaymentId: String,
    },
    { timestamps: true }
);
export default mongoose.model('Booking', s);
