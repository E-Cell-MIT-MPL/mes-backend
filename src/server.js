import cors from "cors";
import express from "express";
import { pino } from "pino";

import { healthCheckRouter } from "./route/healthCheck.route.js";
import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.route.js";

export const serverLogger = pino({ name: "server" });
export const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/auth", authRoutes);

// Request Logging
app.use(httpLogger);

// Routes
app.use("/health-check", healthCheckRouter);

// Error handlers
app.use(errorHandler());
