import { Resend } from "resend";
import { serverLogger } from "../server.js";
import { env } from "../utils/envConfig.js";

// Initialize Resend with your API Key (starts with re_)



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
};


*/



import SibApiV3Sdk from "sib-api-v3-sdk";


// Configure Brevo client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendOtpEmail = async (to, otp) => {
  serverLogger.info("Sending OTP via Brevo to:", to);
  console.log(to);

  try {
    const sendSmtpEmail = {
      sender: {
        name: "E-Cell",
        email: env.EMAIL_FROM,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: "Your OTP for verification for MES 2026",
      htmlContent: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 12px; border: 1px solid #333;">
          <h2 style="color: #783ca0; margin-bottom: 20px;">Verification Code</h2>
          <p style="color: #ccc;">Use the code below to complete your registration for the Manipal Entrepreneurship Summit.</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; margin: 30px 0; color: #fff;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #555;">
            This code expires in 1 minute. If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    };

    const response = await emailApi.sendTransacEmail(sendSmtpEmail);

    serverLogger.info("✅ Brevo success:", response.messageId);
  } catch (err) {
    serverLogger.error("❌ Brevo Error:", err);
    throw err;
  }
};
