import express from "express";
import cors from "cors";
import { pino } from "pino";

import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import scanRoutes from "./routes/scan.route.js";
import { healthCheckRouter } from "./route/healthCheck.route.js";

// Logger instance
export const serverLogger = pino({ name: "server" });

// App instance (⚠️ MUST come before app.use)
export const app = express();

/* -------------------- GLOBAL MIDDLEWARES -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (before routes)
app.use(httpLogger);

/* -------------------- ROUTES -------------------- */
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);
app.use("/scan", scanRoutes); // ✅ SCANNER ROUTE (CORRECT PLACE)

/* -------------------- 404 FALLBACK -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorHandler());
