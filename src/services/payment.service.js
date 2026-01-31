import axios from "axios";
import { env } from "../utils/envConfig.js";
import Ticket from "../models/Ticket.model.js";
import { encryptAtom, decryptAtom } from "../utils/atomAuth.js";

const getFormattedDate = () => {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const initiatePayment = async ({ userId, eventName, amount, userEmail, userMobile }) => {
  try {
    const txnId = `MES${Date.now()}`;
    
    // 1. Create Ticket
    await Ticket.create({
      userId,
      eventName,
      qrData: "PENDING",
      txnId,
      amount,
      paymentStatus: "PENDING",
    });

    // 2. Payload
    const payload = {
      payInstrument: {
        headDetails: {
          version: "OTSv1.1",
          api: "AUTH",
          platform: "FLASH"
        },
        merchDetails: {
          merchId: env.ATOM_MERCH_ID,
          userId: env.ATOM_MERCH_ID,
          password: env.ATOM_MERCH_PASS, 
          merchTxnId: txnId,
          merchTxnDate: getFormattedDate()
        },
        payDetails: {
          amount: "1.00", // 👈 Change this to 1.00 for testing
          product: env.ATOM_PROD_ID,
          custAccNo: "1234567890",
          txnCurrency: "INR"
        },
        custDetails: {
          custEmail: userEmail || "test@example.com",
          custMobile: userMobile || "9999999999"
        },
        extras: {
          udf1: eventName,
          udf2: userId,
          udf3: "MES2026",
          udf4: "",
          udf5: ""
        }
      }
    };

    const encryptedData = encryptAtom(payload);
    
    const params = new URLSearchParams();
    params.append('merchId', env.ATOM_MERCH_ID);
    params.append('encData', encryptedData);

    console.log("🔵 Sending to Atom URL:", env.ATOM_PAYMENT_URL);

    const response = await axios.post(env.ATOM_PAYMENT_URL, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    // 👇 DEBUGGING LOGS (Check your terminal for this!)
    console.log("🟡 RAW ATOM RESPONSE STATUS:", response.status);
    console.log("🟡 RAW ATOM RESPONSE DATA:", response.data); 

    const resData = response.data;
    
    // Check if response is JSON (Error) or String (Success/Error)
    if (typeof resData === 'object') {
         console.error("❌ Atom returned JSON error:", JSON.stringify(resData));
         throw new Error("Atom returned an error object: " + JSON.stringify(resData));
    }

    const urlParams = new URLSearchParams(resData);
    const encResponse = urlParams.get('encData');

    if (!encResponse) {
        // This will now show us exactly what Atom said
        throw new Error(`Atom response missing encData. Raw response: ${resData}`);
    }

    const decrypted = decryptAtom(encResponse);
    console.log("🟢 Decrypted Atom Response:", decrypted);

    if (decrypted && decrypted.atomTokenId) {
        return {
            atomTokenId: decrypted.atomTokenId,
            merchId: env.ATOM_MERCH_ID,
            txnId: txnId
        };
    } else {
        throw new Error("Token generation failed");
    }

  } catch (error) {
    console.error("❌ Payment Error:", error.message);
    throw error;
  }
};

export const handlePaymentCallback = async (data) => {
    return { success: true };
};