export function requireAdmin(req, res, next) {
    if (!req.auth) {
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    if (req.auth.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required",
        });
    }

    next();
}