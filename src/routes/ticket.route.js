import express from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import Ticket from "../models/Ticket.model.js";

const router = express.Router();

// GET MY TICKETS (with payment status)
router.get("/my-tickets", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not fetch tickets",
    });
  }
});

// GET SINGLE TICKET
router.get("/:ticketId", requireAuth, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.userId;

    const ticket = await Ticket.findOne({ _id: ticketId, userId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not fetch ticket",
    });
  }
});

export default router;
