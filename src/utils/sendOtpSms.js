import twilio from "twilio";

console.log("✅ sendOtpSms file loaded");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOtpSms = async (phone, otp) => {
  try {
    console.log("🚀 sendOtpSms CALLED");
    console.log("Phone:", phone);
    console.log("OTP:", otp);

    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`,
    });

    console.log("✅ SMS SENT:", message.sid);
    return true;
  } catch (error) {
    console.error("🔥 TWILIO ERROR FULL:", error);
    throw new Error("Failed to send OTP");
  }
};
