import crypto from "crypto";
import { env } from "./envConfig.js";

const algorithm = "aes-256-cbc";
const key = crypto.scryptSync(env.QR_SECRET, "salt", 32); // Derived from your QR_SECRET
const iv = crypto.randomBytes(16); // Initialization vector

export const encryptTicketData = (data) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // We return the IV + encrypted data so the scanner knows how to decrypt it
    return `${iv.toString("hex")}:${encrypted}`;
};

// This will be used later in your Admin Dashboard
export const decryptTicketData = (encryptedString) => {
    try {
        const [ivHex, dataHex] = encryptedString.split(":");
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, "hex"));
        let decrypted = decipher.update(dataHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return JSON.parse(decrypted);
    } catch (error) {
        return null; // Invalid ticket
    }
};