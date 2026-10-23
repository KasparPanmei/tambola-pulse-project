
import User from "../models/User.js";
import { signToken } from "../utils/auth.js";
import twilio from "twilio";

// Local development safeguard.
// Prevent repeated OTP sends to the same phone number.
const otpRequestCooldowns = new Map();
const OTP_COOLDOWN_MS = 60 * 1000;

function getTwilioClient() {
    const {
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
    } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        throw new Error(
            "Twilio configuration is incomplete. Check " +
            "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in server/.env."
        );
    }

    return twilio(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN
    );
}

function getVerifyServiceSid() {
    const sid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!sid) {
        throw new Error(
            "TWILIO_VERIFY_SERVICE_SID is missing from the server environment."
        );
    }

    return sid;
}

function normalizePhone(phone) {
    const cleaned = String(phone || "").replace(/\s/g, "");

    // Accept valid E.164 international phone numbers.
    if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
        return cleaned;
    }

    // Convert a valid Indian 10-digit mobile number to +91 format.
    if (/^[6-9]\d{9}$/.test(cleaned)) {
        return `+91${cleaned}`;
    }

    return null;
}

async function findUserByPhone(phone) {
    let user = await User.findOne({ phone });

    // Support Indian numbers already stored without +91.
    if (!user && phone.startsWith("+91")) {
        const localNumber = phone.slice(3);

        if (/^[6-9]\d{9}$/.test(localNumber)) {
            user = await User.findOne({
                phone: localNumber,
            });
        }
    }

    return user;
}

function logTwilioError(label, error) {
    // Never log credentials, authorization headers, or OTP values.
    console.error(label, {
        code: error?.code ?? null,
        status: error?.status ?? null,
        message: error?.message ?? "Unknown Twilio error",
        moreInfo: error?.moreInfo ?? null,
        requestId:
            error?.details?.requestId ??
            error?.requestId ??
            null,
    });
}

export async function requestOtp(req, res) {
    const phone = normalizePhone(req.body?.phone);

    if (!phone) {
        return res.status(400).json({
            message:
                "Enter a valid mobile number with country code, " +
                "or a valid 10-digit Indian mobile number.",
        });
    }

    const now = Date.now();
    const nextAllowedAt = otpRequestCooldowns.get(phone) || 0;

    // Reject repeated requests during the cooldown.
    if (now < nextAllowedAt) {
        const retryAfterSeconds = Math.ceil(
            (nextAllowedAt - now) / 1000
        );

        res.set("Retry-After", String(retryAfterSeconds));

        return res.status(429).json({
            message:
                `Please wait ${retryAfterSeconds} seconds ` +
                "before requesting another OTP.",
            retryAfterSeconds,
        });
    }

    try {
        const requestedName = String(
            req.body?.name || ""
        ).trim();

        const existingUser = await findUserByPhone(phone);

        // Check name conflicts before consuming a cooldown.
        if (
            requestedName &&
            existingUser?.name?.trim() &&
            existingUser.name.trim().toLowerCase() !==
            requestedName.toLowerCase()
        ) {
            return res.status(409).json({
                message:
                    "This phone number is already registered " +
                    "under a different name. Please enter another phone number.",
            });
        }

        // Set cooldown immediately before contacting Twilio.
        // This prevents overlapping requests for the same number.
        otpRequestCooldowns.set(
            phone,
            Date.now() + OTP_COOLDOWN_MS
        );

        const client = getTwilioClient();
        const serviceSid = getVerifyServiceSid();

        const verification = await client.verify.v2
            .services(serviceSid)
            .verifications.create({
                to: phone,
                channel: "sms",
            });

        console.log("Twilio Verify request accepted:", {
            status: verification.status,
            channel: verification.channel,
        });

        return res.json({
            message: "OTP sent to your mobile number.",
        });
    } catch (error) {
        logTwilioError("Twilio Verify send failed:", error);

        // Keep the cooldown after a failed request to prevent
        // repeated attempts against Twilio's rate limits.
        return res.status(502).json({
            message:
                "Could not send the OTP SMS. Wait before retrying " +
                "and check the backend terminal for the Twilio error code.",
        });
    }
}

export async function verifyOtp(req, res) {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.otp || "").trim();

    if (!phone || !/^\d{6}$/.test(code)) {
        return res.status(400).json({
            message:
                "Enter a valid mobile number and 6-digit OTP.",
        });
    }

    try {
        const client = getTwilioClient();
        const serviceSid = getVerifyServiceSid();

        const check = await client.verify.v2
            .services(serviceSid)
            .verificationChecks.create({
                to: phone,
                code,
            });

        if (check.status !== "approved") {
            return res.status(400).json({
                message: "Incorrect or expired OTP.",
            });
        }
    } catch (error) {
        logTwilioError("Twilio Verify check failed:", error);

        const codeNumber = Number(error?.code);

        const clientErrorCodes = [
            60200,
            60202,
            60203,
            20404,
        ];

        const isClientError =
            clientErrorCodes.includes(codeNumber);

        return res.status(isClientError ? 400 : 502).json({
            message: isClientError
                ? "Incorrect or expired OTP. Request a new code if needed."
                : "Could not verify the OTP. Check the backend terminal for details.",
        });
    }

    try {
        let user = await findUserByPhone(phone);

        const requestedName = String(
            req.body?.name || ""
        ).trim();

        if (
            requestedName &&
            user?.name?.trim() &&
            user.name.trim().toLowerCase() !==
            requestedName.toLowerCase()
        ) {
            return res.status(409).json({
                message:
                    "This phone number is already registered " +
                    "under a different name. Please enter another phone number.",
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
            if (!user.name?.trim() && requestedName) {
                user.name = requestedName;
            }

            user.phoneVerified = true;
            await user.save();
        }

        // Clear the cooldown after successful verification.
        otpRequestCooldowns.delete(phone);

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
    } catch (error) {
        console.error(
            "User update after OTP verification failed:",
            {
                name: error?.name ?? null,
                message:
                    error?.message ?? "Unknown database error",
            }
        );

        return res.status(500).json({
            message:
                "OTP was verified, but the account could not be updated.",
        });
    }
}
