import bcrypt from "bcryptjs";
import User from "../models/User.js";
import OtpChallenge from "../models/OtpChallenge.js";
import { makeOtp } from "../utils/reference.js";
import { signToken } from "../utils/auth.js";

export async function requestOtp(req, res) {
    const phone = (req.body.phone || "").replace(/\s/g, "");

    if (!/^\+?[1-9]\d{9,14}$/.test(phone)) {
        return res.status(400).json({
            message: "Enter a valid mobile number",
        });
    }

    const requestedName = String(req.body.name || "").trim();
    const existingUser = await User.findOne({ phone });
    // CHANGED: Do not let the same registered phone number be reused under a different booking name.
    if (
        requestedName &&
        existingUser?.name?.trim() &&
        existingUser.name.trim().toLocaleLowerCase() !== requestedName.toLocaleLowerCase()
    ) {
        return res.status(409).json({
            message: "This phone number is already registered under a different name. Please enter another phone number.",
        });
    }

    const otp = makeOtp();

    const hash = await bcrypt.hash(otp, 10);

    const ttl = Number(
        process.env.OTP_TTL_MINUTES || 5,
    );

    await OtpChallenge.deleteMany({
        phone,
        verified: false,
    });

    await OtpChallenge.create({
        phone,
        otpHash: hash,
        expiresAt: new Date(
            Date.now() + ttl * 60000,
        ),
    });

    console.log(`[DEV OTP] ${phone}: ${otp}`);

    res.json({
        message: "OTP sent",
        ...(process.env.NODE_ENV !== "production"
            ? { devOtp: otp }
            : {}),
    });
}

export async function verifyOtp(req, res) {
    const phone = (req.body.phone || "").replace(
        /\s/g,
        "",
    );

    const c = await OtpChallenge.findOne({
        phone,
        verified: false,
    }).sort({
        createdAt: -1,
    });

    if (!c || c.expiresAt < new Date()) {
        return res.status(400).json({
            message: "OTP expired or not found",
        });
    }

    if (c.attempts >= 5) {
        return res.status(429).json({
            message: "Too many OTP attempts",
        });
    }

    c.attempts++;

    const valid = await bcrypt.compare(
        String(req.body.otp || ""),
        c.otpHash,
    );

    if (!valid) {
        await c.save();

        return res.status(400).json({
            message: "Incorrect OTP",
        });
    }

    let user = await User.findOne({ phone });
    const requestedName = String(req.body.name || "").trim();
    // CHANGED: Recheck the identity at OTP verification so a changed name cannot take over an existing phone account.
    if (
        requestedName &&
        user?.name?.trim() &&
        user.name.trim().toLocaleLowerCase() !== requestedName.toLocaleLowerCase()
    ) {
        return res.status(409).json({
            message: "This phone number is already registered under a different name. Please enter another phone number.",
        });
    }

    c.verified = true;
    await c.save();

    if (!user) {
        user = await User.create({
            phone,
            name: (req.body.name || "").trim(),
            phoneVerified: true,
            role: "player",
        });
    } else {
        // CHANGED: Only fill a missing profile name; never overwrite a registered name for the same phone.
        if (!user.name?.trim() && requestedName) {
            user.name = requestedName;
        }

        user.phoneVerified = true;

        await user.save();
    }

    res.json({
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