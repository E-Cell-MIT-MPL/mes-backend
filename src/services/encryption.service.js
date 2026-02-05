import crypto from "crypto";
import { env } from "../utils/envConfig.js";

const reqKey = Buffer.from(env.ATOM_REQ_ENC_KEY.substring(0, 16), "utf8");
const reqIv = Buffer.from(env.ATOM_REQ_SALT.substring(0, 16), "utf8");
const resKey = Buffer.from(env.ATOM_RES_DEC_KEY.substring(0, 16), "utf8");
const resIv = Buffer.from(env.ATOM_RES_SALT.substring(0, 16), "utf8");
const resHashKey = env.ATOM_RES_HASH_KEY; // <-- Make sure this is here!

const algorithm = "aes-128-cbc";

// ADD THIS NEW FUNCTION BELOW YOUR ENCRYPT FUNCTION
export const decryptRequest = (text) => {
  try {
    // This uses reqKey/reqIv to check the payload YOU just encrypted
    const decipher = crypto.createDecipheriv(algorithm, reqKey, reqIv);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return "DECRYPTION_FAILED_CHECK_KEYS";
  }
};

export const decrypt = (text) => {
  try {
    const decipher = crypto.createDecipheriv(algorithm, resKey, resIv);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

export const encrypt = (text) => {
  try {
    // 1. Clean the data to prevent "undefined" or "null" appearing in the string
    const merchId = data.merchId?.toString() || "";
    const atomTxnId = data.atomTxnId || "";
    const merchTxnId = data.merchTxnId?.toString() || "";
    const amount = parseFloat(data.amount).toFixed(2); // Forces "199.00"
    const subChannel =
      (Array.isArray(data.subChannel) ? data.subChannel[0] : data.subChannel) ||
      "";
    const bankTxnId = data.bankTxnId || "";

    // 2. The strict sequence for Atom/NTT Data
    const signatureString =
      merchId + atomTxnId + merchTxnId + amount + subChannel + bankTxnId;

    console.log("[DEBUG] Verifying Signature for String:", signatureString);

    // 3. HMAC-SHA512
    return crypto
      .createHmac("sha512", resHashKey)
      .update(signatureString)
      .digest("hex");
  } catch (error) {
    console.error("❌ Encryption Service Error:", error.message);
    // Return null so the controller can send a 400 instead of crashing with 500
    return null;
  }
};

export const verifySignature = (data, receivedSignature) => {
  if (!receivedSignature) return false;

  const generatedSignature = generateSignature(data);

  // Use timingSafeEqual to prevent timing attacks (Good practice for Tech Heads!)
  const a = Buffer.from(generatedSignature);
  const b = Buffer.from(receivedSignature);

  const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

  console.log(`[DEBUG] Signature Match: ${isValid}`);
  return isValid;
};
