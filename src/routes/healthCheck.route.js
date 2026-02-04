import express from "express";

export const healthCheckRouter = express.Router();

healthCheckRouter.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy and running smoothly 🚀",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});