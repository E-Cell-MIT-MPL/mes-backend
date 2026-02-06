import { Resend } from "resend";
import { serverLogger } from "../server.js";
import { env } from "../utils/envConfig.js";





/*const resend = new Resend(env.RESEND_API_KEY);

export const sendOtpEmail = async (to, otp) => {
  serverLogger.info("Sending OTP via Resend to:", to);
  console.log(to);

  try {
    const { data, error } = await resend.emails.send({
      from: `E-Cell <${env.EMAIL_FROM}>`, // env.EMAIL_FROM must be verified in Resend
      to: [to],
      subject: "Your OTP for verification for  MES 2026",
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 12px; border: 1px solid #333;">
          <h2 style="color: #783ca0; margin-bottom: 20px;">Verification Code</h2>
          <p style="color: #ccc;">Use the code below to complete your registration for the Manipal Entrepreneurship Summit.</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; margin: 30px 0; color: #fff;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #555;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      serverLogger.error("❌ Resend Error:", error);
      console.log(error);
      throw new Error(error.message);
    }

    serverLogger.info("✅ Resend success:", data.id);
  } catch (err) {
    serverLogger.error("❌ Failed to send OTP:", err);
    throw err;
  }
};  */






import Brevo from "@getbrevo/brevo";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.BREVO_API_KEY,
  },
});

export const sendOtpEmail = async (to, otp) => {
  return transporter.sendMail({
    from: `"E-Cell" <${env.EMAIL_FROM}>`,
    to,
    subject: "Your OTP for verification for MES 2026",
    html: `<h2>Your OTP</h2><p>${otp}</p>`,
  });
};