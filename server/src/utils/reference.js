import crypto from "crypto";
export const makeReference = (p) =>
    `${p}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
export const makeOtp = () =>
    String(Math.floor(100000 + Math.random() * 900000));
