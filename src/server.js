import express from "express";
import cors from "cors";
import pino from "pino";

import healthCheckRouter from "./route/healthCheck.route.js";
import authRoutes from "./route/auth.route.js";

import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";

export const serverLogger = pino({ name: "server" });
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(httpLogger);

app.use("/health-check", healthCheckRouter);
app.use("/auth", authRoutes);

app.use(errorHandler());
