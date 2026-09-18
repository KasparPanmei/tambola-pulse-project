import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { startGameEngine } from "./utils/gameEngine.js";
const app = express(),
  PORT = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", rateLimit({ windowMs: 15 * 60000, limit: 30 }));
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use((_, res) => res.status(404).json({ message: "Route not found" }));
app.use((e, _, res, __) =>
  res.status(500).json({ message: e.message || "Internal server error" }),
);
connectDB()
    .then(() => {
        startGameEngine();

        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`,
            );
        });
    })
    .catch((error) => {
        console.error(
            "Database connection failed:",
            error,
        );
    });