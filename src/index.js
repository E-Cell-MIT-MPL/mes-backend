import mongoose from "mongoose";
import { app, serverLogger } from "./server.js";
import { env } from "./utils/envConfig.js";

/* ---------- CONNECT TO DB ---------- */
(async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(env.MONGODB_URL, {
      dbName: env.isTest ? "test" : "prod",
    });
    serverLogger.info("Connected to MongoDB");
  } catch (error) {
    serverLogger.error(error, "MongoDB connection error");
  }
})();

/* ---------- START SERVER ---------- */
const server = app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env;
  serverLogger.info(
    `Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`,
  );
});

/* ---------- GRACEFUL SHUTDOWN ---------- */
const onCloseSignal = () => {
  serverLogger.info("sigint received, shutting down");
  server.close(async () => {
    serverLogger.info("server closed");

    await mongoose.connection.close();
    serverLogger.info("Disconnected from MongoDB");

    process.exit();
  });

  setTimeout(() => process.exit(), 10000);
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);

export default app;
