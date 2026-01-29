import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  console.log("🚀 Sending OTP to:", to);

  const info = await transporter.sendMail({
    from: `"E-Cell" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Your OTP",
    text: `Your OTP is ${otp}`,
    html: `<h2>Your OTP is ${otp}</h2>`,
  });

  console.log("✅ SMTP accepted:", info.response);
};
