import { randomBytes, randomInt } from "node:crypto";

export const makeReference = (prefix) =>
    `${prefix}-${randomBytes(8).toString("hex").toUpperCase()}`;

// Kept for legacy callers; Twilio Verify is the active OTP provider.
export const makeOtp = () => String(randomInt(100000, 1000000));
