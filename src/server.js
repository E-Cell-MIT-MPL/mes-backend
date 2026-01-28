import express from "express";
import cors from "cors";
import { pino } from "pino";

/* -------------------- LOGGER & MIDDLEWARE -------------------- */
import httpLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";

/* -------------------- ROUTES -------------------- */
import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import scanRoutes from "./routes/scan.route.js";
import paymentRoutes from "./routes/payment.route.js";
import { healthCheckRouter } from "./route/healthCheck.route.js"; // ✅ INTENTIONAL

/* -------------------- LOGGER INSTANCE -------------------- */
export const serverLogger = pino({ name: "server" });

/* -------------------- EXPRESS APP -------------------- */
export const app = express();

/* -------------------- GLOBAL MIDDLEWARES -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every request
app.use(httpLogger);

/* -------------------- ROUTE REGISTRATION -------------------- */
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);
app.use("/scan", scanRoutes);
app.use("/payment", paymentRoutes);

/* -------------------- 404 HANDLER -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* -------------------- GLOBAL ERROR HANDLER -------------------- */
app.use(errorHandler());
