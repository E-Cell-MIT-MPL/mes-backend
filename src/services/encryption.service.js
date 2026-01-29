import crypto from "crypto";
import { env } from "../utils/envConfig.js";

const req_enc_key = env.ATOM_REQ_ENC_KEY;
const req_salt = env.ATOM_REQ_SALT;
const res_dec_key = env.ATOM_RES_DEC_KEY;
const res_salt = env.ATOM_RES_SALT;

const resHashKey = env.ATOM_RES_HASH_KEY;

const algorithm = "aes-256-cbc";
const password = Buffer.from(req_enc_key, "utf8");
const salt = Buffer.from(req_salt, "utf8");
const respassword = Buffer.from(res_dec_key, "utf8");
const ressalt = Buffer.from(res_salt, "utf8");
const iv = Buffer.from(
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  "utf8",
);

export const encrypt = (text) => {
  try {
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha512");
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${encrypted.toString("hex")}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

export const decrypt = (text) => {
  try {
    const encryptedText = Buffer.from(text, "hex");
    const derivedKey = crypto.pbkdf2Sync(
      respassword,
      ressalt,
      65536,
      32,
      "sha512",
    );
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

export const generateSignature = (data) => {
  try {
    const signatureString =
      data.merchId.toString() +
      data.atomTxnId +
      data.merchTxnId.toString() +
      data.amount +
      data.productId +
      data.date;

    const hmac = crypto.createHmac("sha512", resHashKey);
    const signature = hmac.update(signatureString);
    const gen_hmac = signature.digest("hex");

    return gen_hmac;
  } catch (error) {
    throw new Error(`Signature generation failed: ${error.message}`);
  }
};

export const verifySignature = (data, receivedSignature) => {
  const generatedSignature = generateSignature(data);
  return generatedSignature === receivedSignature;
};
