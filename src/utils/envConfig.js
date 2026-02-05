import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  HOST: z.string().min(1).default("localhost"),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGIN: z.string().default("http://localhost:8080"), // Changed to string to allow matching
  MONGODB_URL: z.string().min(1),
  QR_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  // Email Configuration
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.coerce.number().int().positive(),
  EMAIL_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),

  // 👇 PAYMENT GATEWAY (FIXED: Defined as strings, not values)
  ATOM_MERCH_ID: z.string().min(1),
  ATOM_MERCH_PASS: z.string().min(1),
  ATOM_PROD_ID: z.string().min(1),
  ATOM_AUTH_URL: z.string().url(),
  ATOM_PAYMENT_URL: z.string().url(),

  ATOM_REQ_HASH_KEY: z.string().min(1),
  ATOM_REQ_SALT: z.string().min(1),
  ATOM_REQ_ENC_KEY: z.string().min(1),
  ATOM_RES_DEC_KEY: z.string().min(1),
  ATOM_RES_SALT: z.string().min(1),
  ATOM_RES_HASH_KEY: z.string().min(1),
});

// Parse the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsedEnv.error.format(), null, 2),
  );
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isProduction: parsedEnv.data.NODE_ENV === "production",
  isTest: parsedEnv.data.NODE_ENV === "test",
};
