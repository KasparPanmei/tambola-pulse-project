import mongoose from "mongoose";
const s = new mongoose.Schema(
    {
        phone: String,
        otpHash: String,
        expiresAt: Date,
        attempts: { type: Number, default: 0 },
        verified: { type: Boolean, default: false },
    },
    { timestamps: true },
);
s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("OtpChallenge", s);
