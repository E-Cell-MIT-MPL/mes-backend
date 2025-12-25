import express from "express";
import cors from "cors";
import { pino } from "pino";

import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import { healthCheckRouter } from "./route/healthCheck.route.js";

export const serverLogger = pino({ name: "server" });
export const app = express();

/* -------------------- MIDDLEWARES -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (should be before routes)
app.use(httpLogger);

/* -------------------- ROUTES -------------------- */
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

/* -------------------- FALLBACK -------------------- */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorHandler());
