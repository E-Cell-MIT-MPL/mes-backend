import jwt from "jsonwebtoken";
import { env } from "../utils/envConfig.js";

export const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;  // Read from httpOnly cookie

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // { userId, userType }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
