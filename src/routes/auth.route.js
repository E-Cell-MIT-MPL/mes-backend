import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js"; 
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.get("/logout", logout);

router.get("/me", requireAuth, getMe); 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;