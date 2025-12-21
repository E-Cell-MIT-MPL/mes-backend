// src/utils/sendEmail.js
import nodemailer from "nodemailer";
import { env } from "./envConfig.js";

export const sendVerificationEmail = async (toEmail, token) => {
  // For production use a real SMTP provider. For dev we can use ethereal or a configured SMTP.
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.ethereal.email",
    port: env.SMTP_PORT ? Number(env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const verifyUrl = `${env.HOST ? `http://${env.HOST}:${env.PORT}` : `http://localhost:${env.PORT}`}/auth/verify-email?token=${token}`;

  const res = await transporter.sendMail({
    from: env.EMAIL_FROM || "no-reply@example.com",
    to: toEmail,
    subject: "Verify your email",
    text: `Verify your account: ${verifyUrl}`,
    html: `<p>Verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  console.log("Email sent (dev):", res.messageId ?? res);
};
