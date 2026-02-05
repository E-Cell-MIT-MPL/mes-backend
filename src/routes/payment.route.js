import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  initiatePayment,
  handlePaymentCallback,
  handlePaymentReturn,
  getPaymentStatus,
  atomRedirectHandler,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/initiate", requireAuth, initiatePayment);
router.post("/return", handlePaymentReturn);
router.all("/atom/redirect", atomRedirectHandler);
router.post("/callback", handlePaymentCallback);
router.get("/status/:ticketId", requireAuth, getPaymentStatus);

export default router;
