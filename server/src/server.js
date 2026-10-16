import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
// ADDED: Resolve the server-owned upload folder used for room music assets.
import path from "node:path";

import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { startGameEngine } from "./utils/gameEngine.js";

const app = express(),
  PORT = process.env.PORT || 5000;

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
// CHANGED: Resolve the production client directory from this file, not from the process working directory.
// This keeps /client/dist correct whether the server starts from the repository root or /server.

const clientDistDirectory = path.resolve(serverDirectory, "../../client/dist");

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
}

app.use(express.json());

// ADDED: Make uploaded room tracks available to authorized clients by their room music URL.
app.use(
  "/media/music",
  express.static(path.join(serverDirectory, "uploads", "music"), {
    fallthrough: false,
  }),
);

app.use("/api/auth", rateLimit({ windowMs: 15 * 60000, limit: 30 }));

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

//for deployment
if (process.env.NODE_ENV === "production") {
  // CHANGED: Serve Vite's JavaScript and CSS assets from the actual production build directory.
  app.use(express.static(clientDistDirectory));

  // CHANGED: Return index.html only for browser document navigation; missing assets now stay 404
  // instead of receiving HTML and triggering a module MIME-type error.
  app.get("/{*splat}", (req, res, next) => {
    if (!req.accepts("html")) return next();
    res.sendFile(path.join(clientDistDirectory, "index.html"));
  });
}

app.use((_, res) => res.status(404).json({ message: "Route not found" }));

app.use((e, _, res, __) =>
  res.status(500).json({ message: e.message || "Internal server error" }),
);

connectDB()
  .then(() => {
    startGameEngine();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
