import crypto from "crypto";
import { env } from "./envConfig.js";

const algorithm = "aes-256-cbc";
// Standard Static IV for Atom UAT/Prod (Fixed Array)
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

export const encryptAtom = (data) => {
  try {
    const text = JSON.stringify(data);
    const password = Buffer.from(env.ATOM_REQ_ENC_KEY, "utf8");
    const salt = Buffer.from(env.ATOM_REQ_SALT, "utf8");

    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha512");
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString("hex");
  } catch (e) {
    console.error("❌ ENCRYPTION FAILED:", e.message);
    throw e;
  }
};

export const decryptAtom = (text) => {
  console.log("\n--- 🔍 STARTING DECRYPTION DEBUG ---");

  try {
    // 1. Check Input
    if (!text) throw new Error("Input text is empty/null");
    console.log(`1. Encrypted Text Length: ${text.length}`);

    // 2. Check Key/Salt Raw Values from Env
    const rawKey = env.ATOM_RES_DEC_KEY;
    const rawSalt = env.ATOM_RES_SALT;

    if (!rawKey) throw new Error("ATOM_RES_DEC_KEY is MISSING in .env");
    if (!rawSalt) throw new Error("ATOM_RES_SALT is MISSING in .env");

    // 3. Check for Hidden Spaces (The #1 Cause of Failure)
    const keyTrimmed = rawKey.trim();
    const saltTrimmed = rawSalt.trim();

    console.log(`2. KEY DEBUG:`);
    console.log(`   - Raw Length: ${rawKey.length}`);
    console.log(`   - Trimmed Length: ${keyTrimmed.length}`);
    if (rawKey.length !== keyTrimmed.length) {
      console.error(
        "   🚨 WARNING: Your ATOM_RES_DEC_KEY has hidden spaces! Check Render/Env.",
      );
    } else {
      console.log("   ✅ Key has no hidden spaces.");
    }

    console.log(`3. SALT DEBUG:`);
    console.log(`   - Raw Length: ${rawSalt.length}`);
    console.log(`   - Trimmed Length: ${saltTrimmed.length}`);
    if (rawSalt.length !== saltTrimmed.length) {
      console.error(
        "   🚨 WARNING: Your ATOM_RES_SALT has hidden spaces! Check Render/Env.",
      );
    } else {
      console.log("   ✅ Salt has no hidden spaces.");
    }

    // 4. Convert to Buffers (Using Trimmed Values to Fix it Automatically)
    const encryptedText = Buffer.from(text, "hex");
    const password = Buffer.from(keyTrimmed, "utf8");
    const salt = Buffer.from(saltTrimmed, "utf8");
    console.log("4. Buffers created successfully.");

    // 5. Generate Derived Key (PBKDF2)
    console.log("5. Generating PBKDF2 Derived Key...");
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha512");
    console.log(
      "   ✅ Derived Key Generated (Length: " + derivedKey.length + ")",
    );

    // 6. Create Decipher
    console.log("6. Creating Decipher (aes-256-cbc)...");
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);

    // 7. Update
    console.log("7. Decrypting content...");
    let decrypted = decipher.update(encryptedText);

    // 8. Finalize (THIS IS USUALLY WHERE "BAD DECRYPT" HAPPENS)
    console.log("8. Finalizing decryption block...");
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    console.log("   ✅ SUCCESS: Decryption complete.");
    console.log("--- 🏁 END DEBUG ---\n");

    return JSON.parse(decrypted.toString());
  } catch (e) {
    console.error("\n❌ DECRYPTION CRASHED AT A SPECIFIC STEP:");
    console.error(`   Error Message: ${e.message}`);

    if (e.message.includes("bad decrypt")) {
      console.error(
        "   👉 DIAGNOSIS: The Key or Salt is 100% WRONG for this data.",
      );
      console.error("      (The lock turned, but the door didn't open.)");
    } else if (e.message.includes("wrong final block length")) {
      console.error(
        "   👉 DIAGNOSIS: The encrypted text is corrupted or cut off.",
      );
    }

    console.log("--- 💀 DEBUG DIED ---\n");
    return null;
  }
};
