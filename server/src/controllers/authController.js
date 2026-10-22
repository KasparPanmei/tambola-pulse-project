import User from "../models/User.js";
import { signToken } from "../utils/auth.js";
import twilio from "twilio";

function getTwilioClient() {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        throw new Error("Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    }
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function getVerifyServiceSid() {
    const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!sid) throw new Error("Twilio Verify is not configured. Set TWILIO_VERIFY_SERVICE_SID.");
    return sid;
}

function toSmsNumber(phone) {
    // Keep the existing database phone format; normalize only the Twilio destination.
    if (phone.startsWith("+")) return phone;
    // Convert Indian 10-digit mobile numbers to E.164.
    if (/^[6-9]\d{9}$/.test(phone)) return `+91${phone}`;
    throw new Error("Use an international number with country code, such as +14155552671.");
}

export async function requestOtp(req, res) {
    const phone = String(req.body?.phone || "").replace(/\s/g, "");

    if (!( /^\+[1-9]\d{9,14}$/.test(phone) || /^[6-9]\d{9}$/.test(phone) )) {
        return res.status(400).json({ message: "Enter a valid mobile number" });
    }

    const requestedName = String(req.body?.name || "").trim();
    const existingUser = await User.findOne({ phone });
    if (
        requestedName &&
        existingUser?.name?.trim() &&
        existingUser.name.trim().toLocaleLowerCase() !== requestedName.toLocaleLowerCase()
    ) {
        return res.status(409).json({
            message: "This phone number is already registered under a different name. Please enter another phone number.",
        });
    }

    try {
        const client = getTwilioClient();
        await client.verify.v2
            .services(getVerifyServiceSid())
            .verifications.create({ to: toSmsNumber(phone), channel: "sms" });

        return res.json({ message: "OTP sent to your mobile number." });
    } catch (error) {
        console.error("Twilio Verify send failed:", error.code || error.message);
        return res.status(502).json({
            message: "Could not send the OTP SMS. Check the mobile number and Twilio configuration.",
        });
    }
}

export async function verifyOtp(req, res) {
    const phone = String(req.body?.phone || "").replace(/\s/g, "");
    const code = String(req.body?.otp || "").trim();

    if (!( /^\+[1-9]\d{9,14}$/.test(phone) || /^[6-9]\d{9}$/.test(phone) ) || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: "Enter a valid mobile number and 6-digit OTP." });
    }

    try {
        const client = getTwilioClient();
        const check = await client.verify.v2
            .services(getVerifyServiceSid())
            .verificationChecks.create({ to: toSmsNumber(phone), code });

        if (check.status !== "approved") {
            return res.status(400).json({ message: "Incorrect or expired OTP" });
        }
    } catch (error) {
        // Twilio Verify rejects invalid, expired, or already-used codes. Do not log the code.
        console.error("Twilio Verify check failed:", error.code || error.message);
        const status = [60200, 60202, 60203, 20404].includes(Number(error.code)) ? 400 : 502;
        return res.status(status).json({
            message: status === 400 ? "Incorrect or expired OTP" : "Could not verify the OTP. Please try again.",
        });
    }

    let user = await User.findOne({ phone });
    const requestedName = String(req.body?.name || "").trim();
    if (
        requestedName &&
        user?.name?.trim() &&
        user.name.trim().toLocaleLowerCase() !== requestedName.toLocaleLowerCase()
    ) {
        return res.status(409).json({
            message: "This phone number is already registered under a different name. Please enter another phone number.",
        });
    }

    if (!user) {
        user = await User.create({
            phone,
            name: requestedName,
            phoneVerified: true,
            role: "player",
        });
    } else {
        if (!user.name?.trim() && requestedName) user.name = requestedName;
        user.phoneVerified = true;
        await user.save();
    }

    return res.json({
        message: "OTP verified",
        token: signToken(user),
        user: {
            id: user._id,
            name: user.name,
            phone: user.phone,
            phoneVerified: user.phoneVerified,
            role: user.role,
        },
    });
}
