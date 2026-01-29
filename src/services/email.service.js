import nodemailer from "nodemailer";

import { serverLogger } from "../server.js";
import { env } from "../utils/envConfig.js";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  serverLogger.info("Sending OTP to:", to);

  const info = await transporter.sendMail({
    from: `"E-Cell" <${env.EMAIL_FROM}>`,
    to,
    subject: "Your OTP",
    text: `Your OTP is ${otp}`,
    html: `<h2>Your OTP is ${otp}</h2>`,
  });

  serverLogger.info("✅ SMTP accepted:", info.response);
};
