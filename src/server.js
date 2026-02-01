import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pino } from "pino";
import { env } from "./utils/envConfig.js"; // 👈 Import your config

import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import scanRoutes from "./routes/scan.route.js";
import paymentRoutes from "./routes/payment.route.js";
import { healthCheckRouter } from "./route/healthCheck.route.js";

export const serverLogger = pino({ name: "server" });
export const app = express();

/* -------------------- GLOBAL MIDDLEWARES -------------------- */
// Add this before your routes to handle preflight globally
// The {*splat} syntax is the Express 5 way to handle global wildcards
app.options("{*splat}", cors());// server.js / index.js
const allowedOrigins = [
  "https://mes26.ecellmit.in",
  "https://www.mes26.ecellmit.in", // Add the WWW version just in case
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      // Normalize by removing trailing slashes
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ""));

      if (normalizedAllowed.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        serverLogger.error(`CORS Blocked Origin: ${origin}`);
        callback(new Error("CORS blocked this origin"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger
app.use(httpLogger);

/* -------------------- ROUTES -------------------- */
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);
app.use("/scan", scanRoutes);
app.use("/payment", paymentRoutes); // [!code ++] <-- ADD 's' HERE to match frontend
/* -------------------- 404 FALLBACK -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* -------------------- START SERVER -------------------- */
// Use Render's dynamic port, fallback to your env config, or 8080
const port = process.env.PORT || env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  serverLogger.info(`Server (${env.NODE_ENV}) running on port ${port}`);
});

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorHandler());