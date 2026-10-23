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

const jwtSecret = process.env.JWT_SECRET || "";
if (jwtSecret.length < 32 || jwtSecret.startsWith("replace-with-")) {
  console.error("JWT_SECRET must be a unique secret with at least 32 characters. Configure it in the hosting environment.");
  process.exit(1);
}

const app = express(),
  PORT = process.env.PORT || 5000;

app.disable("x-powered-by");
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
// CHANGED: Resolve the production client directory from this file, not from the process working directory.
// This keeps /client/dist correct whether the server starts from the repository root or /server.

const clientDistDirectory = path.resolve(serverDirectory, "../../client/dist");

const allowedOrigins = new Set([
  "https://tambola-pulse.online",
  "https://www.tambola-pulse.online",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);

app.use(express.json({ limit: "100kb" }));

// ADDED: Make uploaded room tracks available to authorized clients by their room music URL.
app.use(
  "/media/music",
  express.static(path.join(serverDirectory, "uploads", "music"), {
    fallthrough: false,
  }),
);

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use("/api/auth/request-otp", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP requests. Please try again later." },
}));
app.use("/api/auth/verify-otp", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP attempts. Please try again later." },
}));

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

app.use((error, _, res, __) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
    ? error.status
    : 500;
  if (status >= 500) console.error("Unhandled request error:", error);
  res.status(status).json({
    message: process.env.NODE_ENV === "production"
      ? (status === 404 ? "Resource not found" : "Internal server error")
      : (error.message || "Internal server error"),
  });
});

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
