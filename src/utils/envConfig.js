import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  HOST: z.string().min(1).default("localhost"),

  PORT: z.coerce.number().int().positive().default(8080),

  CORS_ORIGIN: z.url().default("http://localhost:8080"),

  MONGODB_URL: z
    .string({ error: "MongoDB URL connection string" })
    .min(1, { error: "MongoDB URL connection string" }),

  QR_SECRET: z
    .string({ error: "QR Secret is required" })
    .min(1, { error: "QR Secret is required" }),

  JWT_SECRET: z
    .string({ error: "JWT Secret is required" })
    .min(1, { error: "JWT Secret is required" }),

  FRONTEND_URL: z.url().default("http://localhost:3000"),

  // Email Configuration
  EMAIL_HOST: z
    .string({ error: "Email host is required" })
    .min(1, { error: "Email host is required" }),
  EMAIL_PORT: z.coerce
    .number({ error: "Email port must be a number" })
    .int()
    .positive({ error: "Email port must be a positive integer" }),

  EMAIL_PASS: z
    .string({ error: "Email password is required" })
    .min(1, { error: "Email password is required" }),
  EMAIL_FROM: z
    .string({ error: "Email from address is required" })
    .min(1, { error: "Email from address is required" }),
  RESEND_API_KEY: z
    .string({ error: "resend key is required" })
    .min(1, { error: "resend key  is required" }),
  // Payment Gateway
  ATOM_MERCH_ID: z.string().optional(),
  ATOM_MERCH_PASS: z.string().optional(),
  ATOM_PROD_ID: z.string().optional(),
  ATOM_AUTH_URL: z.url().optional(),
  ATOM_PAYMENT_URL: z.url().optional(),
  ATOM_REQ_ENC_KEY: z.string().optional(),
  ATOM_REQ_SALT: z.string().optional(),
  ATOM_RES_DEC_KEY: z.string().optional(),
  ATOM_RES_SALT: z.string().optional(),
  ATOM_RES_HASH_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    z.treeifyError(parsedEnv.error),
  );
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isProduction: parsedEnv.data.NODE_ENV === "production",
  isTest: parsedEnv.data.NODE_ENV === "test",
};
