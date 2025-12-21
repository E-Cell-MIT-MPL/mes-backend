import Student from "../models/student.model.js";
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendOtpSms } from "../utils/sendOtpSms.js";
  
export const sendOtp = async (req, res) => {
  try {
    const { regNo } = req.body;

    const student = await Student.findOne({ regNo });
    if (!student)
      return res.status(404).json({ message: "Invalid reg number" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ regNo });

    await Otp.create({
      regNo,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOtpSms(student.phone, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  const { regNo, otp } = req.body;

  const record = await Otp.findOne({ regNo, otp });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  let user = await User.findOne({ regNo });
  if (!user) {
    const student = await Student.findOne({ regNo });
    user = await User.create({
      regNo,
      phone: student.phone
    });
  }

  await Otp.deleteMany({ regNo });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};
