import crypto from "crypto";

const ALGO = "aes-256-cbc";
const KEY = crypto.createHash("sha256").update("ATOM_SECRET").digest();
const IV = Buffer.alloc(16, 0);

export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(ALGO, KEY, IV);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

export const decrypt = (encrypted) => {
  const decipher = crypto.createDecipheriv(ALGO, KEY, IV);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
