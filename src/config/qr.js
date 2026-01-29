import crypto from "crypto";

import { env } from "../utils/envConfig.js";

const { QR_SECRET } = env;

export function signQR(payload) {
  const data = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(data)
    .digest("hex");

  return { ...payload, signature };
}

export function verifyQR(payload) {
  if (!payload || !payload.signature) return false;

  const { signature, ...rest } = payload;

  const expected = crypto
    .createHmac("sha256", QR_SECRET)
    .update(JSON.stringify(rest))
    .digest("hex");

  return signature === expected;
}
