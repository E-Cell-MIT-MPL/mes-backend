import axios from "axios";
import { env } from "../utils/envConfig.js";
import { decrypt, decryptRequest, encrypt, verifySignature } from "./encryption.service.js";
import Ticket from "../models/Ticket.model.js";
import { encryptAtom, decryptAtom } from "../utils/atomAuth.js";

const getFormattedDate = () => {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const initiatePayment = async ({ userId, eventName, amount, userEmail, userMobile }) => {
  try {
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const email = user.personalEmail;
    const phone = user.phone || "9999999999"; // Fallback

    // Generate transaction ID
    const txnId = generateTxnId();
const txnDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
}).format(new Date()).replace(',', ''); // Result: 31/01/2026 10:30:45

    // Create ticket record (pending payment)
    const qrDataObj = {
      username: user.name,
      email,
      eventName,
      timestamp: new Date().toISOString(),
    };

    const ticket = await Ticket.create({
      userId,
      eventName,
      qrData: "PENDING",
      txnId,
      amount,
      paymentStatus: "PENDING",
    });

    // Prepare payment request payload
   const paymentPayload = {
  login: env.ATOM_MERCH_ID,        // 571016
  pass: "f82d6abe",               // Your transaction password
  ttype: "Sale",        // Required for Paynetz (Standard Sale)
  prodid: "ACADEMY",              // env.ATOM_PROD_ID
  amt: parseFloat(amount).toFixed(2),
  txncurr: "INR",
  txnid: txnId,                   // merchTxnId
  date: txnDate,                  // merchTxnDate
  custacc: phone,                 // custAccNo
  mcc: "8220",                    // mccCode
  // Use the details from your original object
  udf1: user.name || "",
  udf2: eventName,
  // Add these for legacy support
  clientcode: "NA",
  txnscamt: "0.00"
};

    // Encrypt payload
    const jsonString = JSON.stringify(paymentPayload);
    const encryptedData = encrypt(jsonString);



// --- DEBUG START ---
console.log("=== ENCRYPTION ROUND-TRIP TEST ===");
console.log("1. Raw JSON being sent:", jsonString);
console.log("2. Encrypted Hex (to Atom):", encryptedData);

try {
    const doubleCheck = decryptRequest(encryptedData);
    console.log("3. Decrypted back (The 'ID Card'):", doubleCheck);
} catch (e) {
    console.error("3. ERROR: Decryption failed! The gateway won't be able to read this either.",e);
}
console.log("==================================");
// --- DEBUG END ---

    // Send request to ATOM gateway
    const response = await sendAuthRequest(encryptedData);

    // Parse response
    const params = new URLSearchParams(response);
    const encData = params.get("encData");

    if (!encData) {
      throw new Error("Invalid response from payment gateway");
    }

    // Decrypt response
    const decryptedData = decrypt(encData);
    const responseData = JSON.parse(decryptedData);

    serverLogger.info({ txnId, responseData }, "Payment initiation response");

    // Check response status
    if (responseData.responseDetails.txnStatusCode !== "OTS0000") {
      ticket.paymentStatus = "FAILED";
      ticket.statusCode = responseData.responseDetails.txnStatusCode;
      ticket.statusMessage = responseData.responseDetails.statusMessage;
      await ticket.save();

      throw new Error(
        responseData.responseDetails.statusMessage ||
          "Payment initiation failed",
      );
    }

    // Update ticket with token
    ticket.atomTokenId = responseData.atomTokenId;
    ticket.rawResponse = responseData;
    await ticket.save();

    return {
      success: true,
      txnId,
      ticketId: ticket._id,
      atomTokenId: responseData.atomTokenId,
      paymentUrl: env.ATOM_PAYMENT_URL,
      merchId: env.ATOM_MERCH_ID,
    };

/**
 * Send authentication request to ATOM
 */
// Inside your payment.service.js
export const sendAuthRequest = async (encryptedData) => {
  return new Promise((resolve, reject) => {
    unirest
      .post(process.env.ATOM_AUTH_URL) // https://payment.atomtech.in/paynetz/epi/fts
      .headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
      // Legacy Paynetz expects these specific form fields
      .send(`encdata=${encryptedData}& login=${process.env.ATOM_MERCH_ID}`)
      .end((response) => {
        if (response.error || response.status === 500) {
          console.error("[DEBUG] Gateway Error Body:", response.body);
          return reject(new Error("Gateway processing failed. Check credentials."));
        }
        
        // This endpoint usually returns a string or a token directly
        resolve(response.body);
      });
  });
};

/**
 * Handle payment callback/response
 */
export const handlePaymentCallback = async (encryptedResponse) => {
  try {
    // Decrypt response
    const decryptedData = decrypt(encryptedResponse);
    const responseData = JSON.parse(decryptedData);

    serverLogger.info({ responseData }, "Payment callback received");

    // Extract payment details
    const merchDetails = responseData.merchDetails;
    const payDetails = responseData.payDetails;
    const responseDetails = responseData.responseDetails;
    const payModeSpecificData = responseData.payModeSpecificData;

    // Verify signature
    const signatureData = {
      merchId: merchDetails.merchId,
      atomTxnId: payDetails.atomTxnId,
      merchTxnId: merchDetails.merchTxnId,
      amount: payDetails.amount,
      subChannel: payModeSpecificData.subChannel[0],
      bankTxnId: payModeSpecificData.bankDetails.bankTxnId,
    };

    const isSignatureValid = verifySignature(
      signatureData,
      payDetails.signature,
    );

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