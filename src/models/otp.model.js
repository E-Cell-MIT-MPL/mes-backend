import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  regNo: String,
  otp: String,
  expiresAt: Date
});

export default mongoose.model("Otp", otpSchema);
