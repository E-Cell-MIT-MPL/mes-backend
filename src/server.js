import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pino } from "pino";
import { env } from "./utils/envConfig.js";

import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import scanRoutes from "./routes/scan.route.js";
import paymentRoutes from "./routes/payment.route.js";
import tempCallbackRouter from "./routes/tempCallback.route.js";
import { healthCheckRouter } from "./routes/healthCheck.route.js"; // Check spelling!

export const serverLogger = pino({ name: "server" });
export const app = express();

// ✅ CRITICAL: Tells Express to trust the Render Proxy
app.set("trust proxy", 1);

/* -------------------- CORS SETUP (The Fix) -------------------- */
/* -------------------- CORS SETUP (Updated) -------------------- */
const allowedOrigins = [
  "https://mes26.ecellmit.in",
  "https://www.mes26.ecellmit.in",
  "https://psa.atomtech.in", // added new origin that is needed for redirect transaction

  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");

    // 1. Check against the specific list (Production & Localhost)
    const isAllowedList = allowedOrigins.includes(normalizedOrigin);

    // 2. Allow ALL Vercel Preview URLs (Dynamic)
    const isVercel = normalizedOrigin.endsWith(".vercel.app");

    if (isAllowedList || isVercel) {
      callback(null, true);
    } else {
      serverLogger.error(`CORS Blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

// Apply to Main Requests
app.use(cors(corsOptions));

// Apply to Preflight
app.options(/.*/, cors(corsOptions));

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpLogger);

/* -------------------- ROUTES -------------------- */
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);
app.use("/scan", scanRoutes);
app.use("/payment", paymentRoutes);
app.use("/", tempCallbackRouter);

/* -------------------- 404 FALLBACK -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

/* -------------------- START SERVER -------------------- */
const port = process.env.PORT || env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  serverLogger.info(`Server (${env.NODE_ENV}) running on port ${port}`);
});

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorHandler());
