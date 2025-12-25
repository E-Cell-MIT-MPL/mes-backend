import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import { sendOtpEmail } from "../services/email.service.js";
import { generateOtp } from "../utils/otp.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../config/jwt.js";

/**
 * REGISTER
 */
export const register = async (req, res) => {
  try {
    const {
      userType,
      name,
      regNumber,
      learnerEmail,
      personalEmail,
      phone,
      password
    } = req.body;

    // ---------- BASIC VALIDATION ----------
    if (!userType || !phone || !password || !name) {
  return res.status(400).json({ message: "Missing required fields" });
}

    if (userType === "MIT") {
      if (!regNumber || !learnerEmail) {
        return res.status(400).json({ message: "MIT details required" });
      }
      if (!learnerEmail.endsWith("@learner.manipal.edu")) {
        return res.status(400).json({ message: "Invalid learner email" });
      }
    }

    if (userType === "NON_MIT" && !personalEmail) {
      return res.status(400).json({ message: "Personal email required" });
    }

    // ---------- DUPLICATE CHECK ----------
    const existingUser = await User.findOne({
      $or: [
        { phone },
        { learnerEmail },
        { personalEmail },
        { regNumber }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // ---------- CREATE USER ----------
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      userType,
      name,
      regNumber: userType === "MIT" ? regNumber : null,
      learnerEmail: userType === "MIT" ? learnerEmail : null,
      personalEmail: personalEmail || null,
      phone,
      password: hashedPassword,
      isVerified: false
    });

    // ---------- OTP ----------
    const otp = generateOtp();
    const emailToSendOtp =
      learnerEmail || personalEmail; // 👈 ALWAYS SEND TO ENTERED EMAIL

    await Otp.deleteMany({ email: emailToSendOtp });

    await Otp.create({
      email: emailToSendOtp,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

  try {
  await sendOtpEmail(emailToSendOtp, otp);
} catch (emailError) {
  console.error("EMAIL FAILED 👉", emailError.message);
  // DO NOT throw
}

return res.status(201).json({
  message: "Registered successfully. OTP sent to email."
});

  } catch (error) {
  console.error("REGISTER ERROR 👉", error);
  return res.status(500).json({
    message: "Registration failed",
    error: error.message
  });
}
};

/**
 * VERIFY OTP
 */
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

    await User.findOneAndUpdate(
      {
        $or: [{ learnerEmail: email }, { personalEmail: email }]
      },
      { isVerified: true }
    );

    await Otp.deleteMany({ email });

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

/**
 * LOGIN
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      $or: [{ learnerEmail: email }, { personalEmail: email }]
    });

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
      userType: user.userType
    });

    return res.json({
      message: "Login successful",
      token
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
};
/**
 * RESEND OTP
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({
      $or: [{ learnerEmail: email }, { personalEmail: email }]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Generate new OTP
    const otp = generateOtp();

    // Remove old OTPs
    await Otp.deleteMany({ email });

    // Save new OTP
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    });

    // Send OTP (non-blocking)
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
/**
 * =========================
 * FORGOT PASSWORD
 * =========================
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      $or: [{ learnerEmail: email }, { personalEmail: email }]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      console.error("EMAIL FAILED 👉", err.message);
    }

    return res.json({
      message: "Password reset OTP sent to email"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Forgot password failed" });
  }
};
/**
 * =========================
 * RESET PASSWORD
 * =========================
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await User.findOneAndUpdate(
      { $or: [{ learnerEmail: email }, { personalEmail: email }] },
      { password: hashedPassword }
    );

    await Otp.deleteMany({ email });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Reset password failed" });
  }
};
