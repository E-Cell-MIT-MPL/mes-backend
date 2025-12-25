import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import User from "../models/User.model.js";
import Ticket from "../models/Ticket.model.js"; // <--- Import the new model

const router = express.Router();

// 1. BUY TICKET (Updated to Save to DB)
router.post("/buy", requireAuth, async (req, res) => {
  try {
    const { eventName } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    // Create the QR Data
    const qrDataObj = {
      username: user.name,
      email: user.learnerEmail || user.personalEmail,
      eventName: eventName,
      timestamp: new Date().toISOString()
    };
    const qrDataString = JSON.stringify(qrDataObj);

    // SAVE TO DB
    const ticket = await Ticket.create({
      userId,
      eventName,
      qrData: qrDataString
    });

    res.status(200).json({
      message: "Ticket purchased successfully",
      qrData: ticket.qrData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ticket purchase failed" });
  }
});

// 2. GET MY TICKETS (New Route!)
router.get("/my-tickets", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 }); // Newest first
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch tickets" });
  }
});

export default router;