import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: Date,
  // ⚠️ CRITICAL: You must define this or User.create() will fail in verifyOtp
  registrationData: {
    userType: String,
    name: String,
    regNumber: String,
    learnerEmail: String,
    personalEmail: String,
    phone: String,
    password: { type: String },
    referralCode: String,
  },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
