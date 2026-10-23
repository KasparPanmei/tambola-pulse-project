
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { startGameEngine } from "./utils/gameEngine.js";


const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(serverDirectory, "../.env");

let envLoaded = false;

if (process.env.NODE_ENV !== "production") {
  const envResult = dotenv.config({ path: envPath });

  envLoaded = !envResult.error;

  if (envResult.error) {
    console.warn(
      "Local environment file was not loaded:",
      envResult.error.message
    );
    console.warn(
      "If required variables are missing, configure them in server/.env."
    );
  }
} else {
  // In production, use environment variables configured by the host.
  envLoaded = Boolean(process.env.JWT_SECRET);
}

const jwtSecret = process.env.JWT_SECRET || "";

if (
  jwtSecret.length < 32 ||
  jwtSecret.startsWith("replace-with-")
) {
  console.error(
    "JWT_SECRET must be a unique secret containing at least 32 characters."
  );
  console.error(
    "Configure JWT_SECRET in your local server/.env or hosting environment."
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

console.log("SERVER STARTUP CHECK", {
  entryFile: fileURLToPath(import.meta.url),
  nodeEnv: process.env.NODE_ENV || "development",
  envLoaded,
  jwtSecretPresent: Boolean(process.env.JWT_SECRET),
  mongoUriPresent: Boolean(process.env.MONGO_URI),
  twilioAccountSidPresent: Boolean(process.env.TWILIO_ACCOUNT_SID),
  twilioAuthTokenPresent: Boolean(process.env.TWILIO_AUTH_TOKEN),
  twilioVerifyServiceSidPresent: Boolean(
    process.env.TWILIO_VERIFY_SERVICE_SID
  ),
  trustProxy: app.get("trust proxy"),
});

app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  next();
});

const clientDistDirectory = path.resolve(
  serverDirectory,
  "../../client/dist"
);

const allowedOrigins = new Set(
  [
    "https://tambola-pulse.online",
    "https://www.tambola-pulse.online",
    "https://tambola-pulse.vercel.app",
    "http://localhost:5173",
    process.env.CLIENT_URL,
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Do not allow unlisted browser origins.
      return callback(null, false);
    },
  })
);


app.use(express.json({ limit: "100kb" }));


app.use(
  "/media/music",
  express.static(
    path.join(serverDirectory, "uploads", "music"),
    {
      fallthrough: false,
    }
  )
);


app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Limit OTP requests.
app.use(
  "/api/auth/request-otp",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many OTP requests. Please try again later.",
    },
  })
);

// Limit OTP verification attempts.
app.use(
  "/api/auth/verify-otp",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many OTP attempts. Please try again later.",
    },
  })
);

app.get("/api/health", (_, res) => {
  res.json({
    ok: true,
    message: "Tambola Pulse API is running.",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDistDirectory));

  app.get("/{*splat}", (req, res, next) => {
    // Let API and non-HTML requests reach the 404 handler.
    if (!req.accepts("html")) {
      return next();
    }

    res.sendFile(
      path.join(clientDistDirectory, "index.html"),
      (error) => {
        if (error) {
          next(error);
        }
      }
    );
  });
}

app.use((_, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


app.use((error, _, res, __) => {
  const status =
    Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status <= 599
      ? error.status
      : 500;

  if (status >= 500) {
    console.error("Unhandled request error:", error);
  }

  res.status(status).json({
    message:
      process.env.NODE_ENV === "production"
        ? status === 404
          ? "Resource not found"
          : "Internal server error"
        : error.message || "Internal server error",
  });
});

async function startServer() {
  try {
    await connectDB();

    startGameEngine();

    app.listen(PORT, () => {
      console.log(`Tambola Pulse server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
