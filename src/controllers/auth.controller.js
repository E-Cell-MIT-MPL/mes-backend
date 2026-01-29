import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import { sendOtpEmail } from "../services/email.service.js";
import { generateOtp } from "../utils/otp.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../config/jwt.js";

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
    const existingUser = await User.findOne({
      $or: [{ phone }, { learnerEmail }, { personalEmail }, { regNumber }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    /* -------- CREATE USER -------- */
    const hashedPassword = await hashPassword(password);

    await User.create({
      userType,
      name,
      regNumber: userType === "MIT" ? regNumber : null,
      learnerEmail: userType === "MIT" ? learnerEmail : null,
      personalEmail,
      phone,
      password: hashedPassword,
      isVerified: false,
    });

    /* -------- OTP -------- */
    const otp = generateOtp();

    // ✅ ALWAYS SEND OTP TO PERSONAL EMAIL
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
      console.error("EMAIL FAILED 👉", err.message);
    }

    return res.status(201).json({
      message: "Registered successfully. OTP sent to personal email.",
    });
  } catch (error) {
    console.error("REGISTER ERROR 👉", error);
    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await User.findOneAndUpdate({ personalEmail: email }, { isVerified: true });

    await Otp.deleteMany({ email });

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
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

    return res
      .cookie("jwt", token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        message: "Login successful",
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
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
      console.error("EMAIL FAILED 👉", err.message);
    }

    return res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
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
      console.error("EMAIL FAILED 👉", err.message);
    }

    return res.json({ message: "Password reset OTP sent" });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return res.status(500).json({ message: "Reset password failed" });
  }
};
