import express from "express";
import { scanTicket } from "../controllers/scan.controller.js";

const router = express.Router();

/**
 * POST /scan/scan
 */
router.post("/scan", scanTicket);

export default router;
