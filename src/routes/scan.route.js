import express from "express";
import { 
    scanTicket, 
    getDashboardStats,
    getScanHistory // <--- 1. IMPORT THIS
} from "../controllers/scan.controller.js";

const router = express.Router();

/**
 * POST /scan/scan
 */
router.post("/ticket", scanTicket);
router.get("/stats", getDashboardStats);
router.get("/history", getScanHistory);
export default router;
