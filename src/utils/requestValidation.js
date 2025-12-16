import status from "http-status";

import { HttpException } from "../lib/httpException.js";

/**
 * Validate request body
 * @param schema {import("zod").ZodAny}
 * @returns {import("express").RequestHandler}
 */
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      params: req.params,
    });
    next();
  } catch (error) {
    const errors = error.issues.map((e) => {
      const fieldPath = e.path.length > 0 ? e.path.join(".") : "root";
      return `${fieldPath}: ${e.message}`;
    });

    const errorMessage =
      errors.length === 1
        ? `Invalid input: ${errors[0]}`
        : `Invalid input (${errors.length} errors): ${errors.join("; ")}`;

    throw new HttpException(status.BAD_REQUEST, errorMessage);
  }
};
