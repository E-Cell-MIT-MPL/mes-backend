import unirest from "unirest";

import { env } from "../utils/envConfig.js";
import { decrypt, decryptRequest, encrypt, verifySignature } from "./encryption.service.js";
import Ticket from "../models/Ticket.model.js";
import User from "../models/User.model.js";
import { serverLogger } from "../server.js";

/**
 * Generate unique transaction ID
 */
export const generateTxnId = () => {
  const timestamp = new Date().getTime().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `MES${timestamp}${random}`.toUpperCase();
};

/**
 * Initiate payment with ATOM gateway
 */
export const initiatePayment = async ({ userId, eventName, amount }) => {
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
      qrData: JSON.stringify(qrDataObj),
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
  } catch (error) {
    serverLogger.error({ error: error.message }, "Payment initiation error");
    throw error;
  }
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

    if (!isSignatureValid) {
      serverLogger.error(
        { txnId: merchDetails.merchTxnId },
        "Signature verification failed",
      );

      throw new Error("Signature verification failed");
    }

    // Find ticket
    const ticket = await Ticket.findOne({ txnId: merchDetails.merchTxnId });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Update ticket
    ticket.atomTxnId = payDetails.atomTxnId;
    ticket.signature = payDetails.signature;
    ticket.signatureVerified = isSignatureValid;
    ticket.statusCode = responseDetails.statusCode;
    ticket.statusMessage = responseDetails.statusMessage;
    ticket.paymentMode = payDetails.paymentMode || null;
    ticket.rawResponse = responseData;

    // Determine final status
    if (responseDetails.statusCode === "OTS0000") {
      ticket.paymentStatus = "SUCCESS";
    } else if (responseDetails.statusCode === "OTS0001") {
      ticket.paymentStatus = "FAILED";
    } else {
      ticket.paymentStatus = "CANCELLED";
    }

    await ticket.save();

    return {
      success: ticket.paymentStatus === "SUCCESS",
      txnId: ticket.txnId,
      ticketId: ticket._id,
      atomTxnId: ticket.atomTxnId,
      status: ticket.paymentStatus,
      amount: ticket.amount,
      statusMessage: ticket.statusMessage,
    };
  } catch (error) {
    serverLogger.error(
      { error: error.message },
      "Payment callback handling error",
    );

    throw error;
  }
};
