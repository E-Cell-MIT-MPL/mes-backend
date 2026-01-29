import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  initiatePayment,
  handlePaymentCallback,
  getPaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

// Initiate payment (protected)
router.post("/initiate", requireAuth, initiatePayment);

// Payment gateway callback (public - no auth)
router.post("/callback", handlePaymentCallback);

// Get payment status (protected)
router.get("/status/:ticketId", requireAuth, getPaymentStatus);

export default router;
