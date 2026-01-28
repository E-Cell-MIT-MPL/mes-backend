import express from "express";
import {
  initiatePayment,
  paymentResponse,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/initiate", initiatePayment);
router.post("/response", paymentResponse);

export default router;
