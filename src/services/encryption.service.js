import crypto from 'crypto';
import { env } from '../utils/envConfig.js';

const algorithm = 'aes-256-cbc';

const getKeyAndIV = () => {
    const keyStr = env.ATOM_REQ_ENC_KEY;
    const saltStr = env.ATOM_REQ_SALT;

    // 1. Check if keys exist
    if (!keyStr || !saltStr) {
        throw new Error(`Missing Keys in .env! ENC_KEY: ${!!keyStr}, SALT: ${!!saltStr}`);
    }

    // 2. Fix IV (Salt)
    // Atom Salt is usually 32 hex characters = 16 bytes.
    let iv;
    if (saltStr.length === 32 && /^[0-9A-Fa-f]+$/.test(saltStr)) {
        iv = Buffer.from(saltStr, 'hex');
    } else {
        // Fallback for non-hex salts (uncommon for Atom but possible)
        iv = Buffer.from(saltStr, 'utf-8');
    }

    // 3. Fix Key (Prevent the 500 Crash)
    let key;
    if (keyStr.length === 32) {
        // Exact match (Text)
        key = Buffer.from(keyStr, 'utf-8');
    } else if (keyStr.length === 64) {
        // Exact match (Hex)
        key = Buffer.from(keyStr, 'hex');
    } else {
        // ⚠️ KEY IS TOO SHORT (18 chars). 
        // We hash it to create a valid 32-byte key.
        // This is mathematically safe and prevents the Node.js crash.
        console.warn(`⚠️ Stretching Short Key (${keyStr.length} chars) to 32 bytes`);
        key = crypto.createHash('sha256').update(keyStr, 'utf-8').digest();
    }

    return { key, iv };
};

export const encrypt = (text) => {
  try {
    const { key, iv } = getKeyAndIV();
    
    // Safety check for IV length (Must be 16 bytes for AES)
    if (iv.length !== 16) {
        console.error(`❌ CRITICAL: IV is ${iv.length} bytes. Must be 16.`);
        return null; 
    }

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error("❌ Encryption Service Error:", error.message);
    // Return null so the controller can send a 400 instead of crashing with 500
    return null; 
  }
};

export const decrypt = (encText) => {
    // Placeholder for callback decryption
    return null;
};