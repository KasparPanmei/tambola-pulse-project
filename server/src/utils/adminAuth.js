import User from "../models/User.js";
import AdminSession from "../models/AdminSession.js";

export const ADMIN_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export async function requireAdmin(req, res, next) {
    try {
        if (!req.auth?.sub || req.auth.role !== "admin" || !req.auth.sid) {
            return res.status(401).json({
                message: "Admin session required. Please sign in with OTP again.",
                code: "ADMIN_SESSION_REQUIRED",
            });
        }

        const session = await AdminSession.findOne({
            _id: req.auth.sid,
            adminId: req.auth.sub,
            revokedAt: null,
        });

        if (!session) {
            return res.status(401).json({
                message: "Admin session ended. Please sign in with OTP again.",
                code: "ADMIN_SESSION_ENDED",
            });
        }

        const now = new Date();
        if (now.getTime() - new Date(session.lastActivityAt).getTime() >= ADMIN_IDLE_TIMEOUT_MS) {
            session.revokedAt = now;
            await session.save();
            return res.status(401).json({
                message: "Admin session expired after 24 hours of inactivity. Please sign in with OTP again.",
                code: "ADMIN_SESSION_EXPIRED",
            });
        }

        const user = await User.findById(req.auth.sub).select("role").lean();
        if (!user) {
            session.revokedAt = now;
            await session.save();
            return res.status(401).json({ message: "Authentication required" });
        }

        if (user.role !== "admin") {
            session.revokedAt = now;
            await session.save();
            return res.status(403).json({ message: "Admin access required" });
        }

        // Only successful, authenticated admin API activity refreshes the idle timer.
        session.lastActivityAt = now;
        await session.save();

        return next();
    } catch (error) {
        return next(error);
    }
}
