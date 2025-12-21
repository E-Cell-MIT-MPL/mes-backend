import mongoose from "mongoose";
import { env } from "../utils/envConfig.js";

mongoose
  .connect(env.MONGODB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));
  console.log("DB URL USED:", env.MONGODB_URL);

