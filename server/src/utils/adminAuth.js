import User from "../models/User.js";

export async function requireAdmin(req, res, next) {
    try {
        if (!req.auth?.sub) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Re-check the current database role so a demoted admin's unexpired JWT
        // cannot continue authorizing privileged operations for up to seven days.
        const user = await User.findById(req.auth.sub).select("role").lean();
        if (!user) return res.status(401).json({ message: "Authentication required" });
        if (user.role !== "admin" || req.auth.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }
        return next();
    } catch (error) {
        return next(error);
    }
}
