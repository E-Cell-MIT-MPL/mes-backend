import express from "express";
import { v4 as uuidv4 } from "uuid"; 

import { requireAuth } from "../middleware/auth.middleware.js";
import Ticket from "../models/Ticket.model.js";
import { serverLogger } from "../server.js";

const router = express.Router();

// --- CONFIGURATION (Controlled by Backend) ---
const EVENT_CONFIG = {
    name: "MES Conclave 2026",
    price: 499,
    venue: "MIT Campus"
};

// 1. GENERATE TICKET (GET REQUEST)
// Frontend just calls: /tickets/generate
router.get("/generate", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // A. Check if they already have it
    const existingTicket = await Ticket.findOne({ userId, eventName: EVENT_CONFIG.name });
    
    if (existingTicket) {
      return res.status(200).json({ 
        success: true, 
        message: "You already have this ticket!", 
        data: existingTicket 
      });
    }

    // B. Create the Ticket
    // The Backend decides the price and status, not the frontend
    const newTicket = await Ticket.create({
      userId,
      eventName: EVENT_CONFIG.name,
      amount: EVENT_CONFIG.price,
      paymentStatus: "SUCCESS", // Auto-approve for demo
      txnId: "TXN_" + uuidv4().split('-')[0].toUpperCase(),
      qrData: JSON.stringify({
          uid: userId,
          evt: EVENT_CONFIG.name,
          ref: uuidv4()
      })
    });

    return res.status(201).json({
      success: true,
      message: "Ticket generated successfully",
      data: newTicket,
    });

  } catch (error) {
    serverLogger.error("Ticket Gen Error:", error);
    res.status(500).json({ success: false, message: "Server error generating ticket" });
  }
});

// 2. GET MY TICKETS
router.get("/my-tickets", requireAuth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    serverLogger.error("Fetch Tickets Error:", error);
    res.status(500).json({ success: false, message: "Could not fetch tickets" });
  }
});

export default router;
