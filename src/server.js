import cors from "cors";
import express from "express";
import { pino } from "pino";

export const serverLogger = pino({ name: "server" });
export const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
