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
  logout, // 👈 verify this is imported
} from "../controllers/auth.controller.js";

// 👇 DEBUG LOG 1: Runs when server starts
console.log("🔥 [DEBUG] Loading auth.route.js...");

if (logout) {
    console.log("   ✅ [DEBUG] Logout controller found.");
} else {
    console.error("   ❌ [DEBUG] Logout controller is UNDEFINED! Check imports.");
}

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

// 👇 DEBUG LOG 2: Runs when you click the button
router.get("/logout", (req, res, next) => {
    console.log("   🚀 [DEBUG] /logout route hit!");
    logout(req, res, next);
});

router.get("/me", requireAuth, getMe); 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// 👇 DEBUG LOG 3: Prints all registered routes
console.log("   🛠️ [DEBUG] Registered Auth Routes:");
router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`      - ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
    }
});

export default router;