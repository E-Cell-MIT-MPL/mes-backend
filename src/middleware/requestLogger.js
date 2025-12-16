import pinoHttp from "pino-http";

import { env } from "../utils/envConfig.js";

const httpLogger = pinoHttp({
  name: "http",

  customLogLevel: (req, res, error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || error) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return "silent";
    }
    return "info";
  },
  customErrorMessage: (_req, res) =>
    `Request failed with status code: ${res.statusCode}`,
  customSuccessMessage: (req) => `${req.method} ${req.url} request completed`,

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  level: env.isProduction ? "info" : "debug",
  transport: env.isProduction ? undefined : { target: "pino-pretty" },
});

export default httpLogger;
