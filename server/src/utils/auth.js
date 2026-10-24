import jwt from "jsonwebtoken";

export const signToken = (user, extraClaims = {}) =>
    jwt.sign(
        {
            sub: user._id.toString(),
            phone: user.phone,
            role: user.role || "player",
            ...extraClaims,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        },
    );

export function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";

        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        req.auth = jwt.verify(
            header.slice(7),
            process.env.JWT_SECRET,
        );

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
