import crypto from "crypto";
import { env } from "./envConfig.js";

const algorithm = "aes-256-cbc";
// Standard Static IV for Atom UAT
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

export const encryptAtom = (data) => {
  const text = JSON.stringify(data);
  // Using the names defined in your Zod schema
  const password = Buffer.from(env.ATOM_REQ_ENC_KEY, "utf8");
  const salt = Buffer.from(env.ATOM_REQ_SALT, "utf8");

  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha512");
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
};

export const decryptAtom = (text) => {
  try {
    const encryptedText = Buffer.from(text, "hex");
    const password = Buffer.from(env.ATOM_RES_DEC_KEY, "utf8");
    const salt = Buffer.from(env.ATOM_RES_SALT, "utf8");

    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha512");
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (e) {
    console.error("Decryption failed:", e.message);
    return null;
  }
};