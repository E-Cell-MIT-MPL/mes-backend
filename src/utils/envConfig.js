import "dotenv/config";
import { z } from "zod";
console.log("MONGODB_URL =", process.env.MONGODB_URL);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  HOST: z.string().min(1).default("localhost"),

  PORT: z.coerce.number().int().positive().default(8080),

  CORS_ORIGIN: z.url().default("http://localhost:8080"),

  MONGODB_URL: z.string({ error: "MongoDB URL connection string" }),
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
