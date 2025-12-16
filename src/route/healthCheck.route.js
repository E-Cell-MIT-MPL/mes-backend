import { Router } from "express";
import status from "http-status";

export const healthCheckRouter = Router();

healthCheckRouter.get("/", (_req, res) => {
  res.status(status.OK).send({
    success: true,
    message: "Service is healthy and running",
    payload: null,
  });
});
