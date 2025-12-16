import cors from "cors";
import express from "express";
import { pino } from "pino";
import { healthCheckRouter } from "./route/healthCheck.route.js";

export const serverLogger = pino({ name: "server" });
export const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use("/health-check", healthCheckRouter);
