import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js"; // Ensure this matches your file name
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

router.get("/me", requireAuth, getMe); 

// NEW
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
