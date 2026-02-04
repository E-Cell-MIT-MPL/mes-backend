import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import { sendOtpEmail } from "../services/email.service.js";
import { generateOtp } from "../utils/otp.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../config/jwt.js";
import { serverLogger } from "../server.js";

/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  try {
    const {
      userType,
      name,
      regNumber,
      learnerEmail,
      personalEmail,
      phone,
      password,
    } = req.body;

    /* -------- BASIC VALIDATION -------- */
    if (!userType || !name || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (userType === "MIT") {
      if (!regNumber || !learnerEmail || !personalEmail) {
        return res.status(400).json({
          message: "Reg number, learner email and personal email are required",
        });
      }

      if (!learnerEmail.endsWith("@learner.manipal.edu")) {
        return res.status(400).json({ message: "Invalid learner email" });
      }
    }

    if (userType === "NON_MIT" && !personalEmail) {
      return res.status(400).json({ message: "Personal email required" });
    }

    /* -------- DUPLICATE CHECK -------- */
    const existingUser = await User.findOne({ personalEmail });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({ message: "User already exists" });
      }
      await User.deleteOne({ _id: existingUser._id });
    }
    // ... Proceed with creating the new user and sending OTP ...

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    /* -------- GENERATE AND SEND OTP FIRST -------- */
    const otp = generateOtp();
    const emailToSendOtp = personalEmail;

    await Otp.deleteMany({ email: emailToSendOtp });

    await Otp.create({
      email: emailToSendOtp,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      await sendOtpEmail(emailToSendOtp, otp);
    } catch (err) {
      serverLogger.error("EMAIL FAILED", err.message);
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    /* -------- STORE TEMPORARY REGISTRATION DATA -------- */
    // Store registration data temporarily (you may want to use a separate TempUser model or Redis)
    const hashedPassword = await hashPassword(password);

    await Otp.findOneAndUpdate(
      { email: emailToSendOtp },
      {
        registrationData: {
          userType,
          name,
          regNumber: userType === "MIT" ? regNumber : null,
          learnerEmail: userType === "MIT" ? learnerEmail : null,
          personalEmail,
          phone,
          password: hashedPassword,
        },
      },
      { new: true },
    );

    return res.status(201).json({
      message: "OTP sent to personal email. Verify to complete registration.",
    });
  } catch (error) {
    serverLogger.error("REGISTER ERROR", error);
    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
/* =========================
   VERIFY OTP (Fixed with Auto-Login)
========================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    let user; // 👈 We need to capture the user object

    /* -------- CREATE USER AFTER OTP VERIFICATION -------- */
    if (otpRecord.registrationData) {
      user = await User.create({
        ...otpRecord.registrationData,
        isVerified: true,
      });
    } else {
      // For existing users resending OTP
      user = await User.findOneAndUpdate(
        { personalEmail: email },
        { isVerified: true },
        { new: true } // Ensure we get the updated document
      );
    }

    await Otp.deleteMany({ email });

    /* -------- ✅ NEW: AUTO-LOGIN LOGIC (Copied from Login) -------- */
    const token = signToken({
      userId: user._id,
      userType: user.userType,
    });

    return res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS/Production
        sameSite: process.env.COOKIE_SAME_SITE || "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Email verified and logged in successfully",
        success: true, // 👈 Added explicit success flag for Frontend
        user: {
          userId: user._id,
          userType: user.userType,
          name: user.name,
        },
      });
      
  } catch (error) {
    serverLogger.error("OTP Verification Error", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ personalEmail: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = signToken({
      userId: user._id,
      userType: user.userType,
    });

    // auth.controller.js -> login function
    return res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: true, // Must be true for SameSite=None
        sameSite: process.env.COOKIE_SAME_SITE || "none", // Must be a string "none"
        path: "/", // Explicitly set path to root
        domain: '.ecellmit.in' ,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        user: {
          // Pro-tip: Send some user data so the frontend can update state immediately
          userId: user._id,
          userType: user.userType,
        },
      });
  } catch (error) {
    serverLogger.error("Login Error", error);
    return res.status(500).json({ message: "Login failed" });
  }
};
/* =========================
   LOGOUT
========================= */
export const logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: process.env.COOKIE_SAME_SITE || "none",
        path: "/",
        domain: '.ecellmit.in' ,
      });

    return res.status(200).json({ 
        success: true, 
        message: "Logged out successfully" 
    });
  } catch (error) {
    serverLogger.error("Logout Error", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};
/* =========================
   RESEND OTP
========================= */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ personalEmail: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const otp = generateOtp();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      serverLogger.error("EMAIL FAILED", err.message);
    }

    return res.json({ message: "OTP resent successfully" });
  } catch (error) {
    serverLogger.error("Resend OTP Error", error);
    return res.status(500).json({ message: "Resend OTP failed" });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ personalEmail: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      serverLogger.error("EMAIL FAILED 👉", err.message);
    }

    return res.json({ message: "Password reset OTP sent" });
  } catch (error) {
    serverLogger.error("Forgot Password Error", error);
    return res.status(500).json({ message: "Forgot password failed" });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await User.findOneAndUpdate(
      { personalEmail: email },
      { password: hashedPassword },
    );

    await Otp.deleteMany({ email });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    serverLogger.error("Reset Password Error", error);
    return res.status(500).json({ message: "Reset password failed" });
  }
};

/* =========================
   GET CURRENT USER (ME)
========================= */
/* =========================
   GET CURRENT USER (The Missing Link)
========================= */
export const getMe = async (req, res) => {
  try {
    // We can access req.userId because the middleware set it
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("GetMe Error:", error.message);
    res.status(500).json({ success: false, message: "Server error fetching user" });
  }
};
