import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  initiatePayment,
  handlePaymentCallback,
  handlePaymentReturn,
  getPaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/initiate", requireAuth, initiatePayment);
router.post("/return", handlePaymentReturn);
router.post("/callback", handlePaymentCallback);
router.get("/status/:ticketId", requireAuth, getPaymentStatus);

export default router;
