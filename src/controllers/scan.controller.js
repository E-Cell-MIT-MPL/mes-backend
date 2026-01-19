import Ticket from "../models/Ticket.model.js";
import { verifyQR } from "../config/qr.js";

export const scanTicket = async (req, res) => {
  try {
    const qrPayload = req.body;

    // 1️⃣ Verify QR authenticity
    if (!verifyQR(qrPayload)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or tampered QR"
      });
    }

    const { ticketId } = qrPayload;

    // 2️⃣ Fetch ticket
    const ticket = await Ticket.findById(ticketId).populate("userId");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // 3️⃣ Block re-entry
    if (ticket.isUsed) {
      return res.status(409).json({
        success: false,
        message: "Ticket already used",
        usedAt: ticket.usedAt
      });
    }

    // 4️⃣ Mark attendance
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.usedBy = req.headers["x-device"] || "scanner";
    await ticket.save();

    // 5️⃣ Success response
    return res.json({
      success: true,
      message: "ENTRY ALLOWED",
      attendee: {
        name: ticket.userId.name,
        email:
          ticket.userId.learnerEmail ||
          ticket.userId.personalEmail ||
          null
      },
      eventName: ticket.eventName,
      scannedAt: ticket.usedAt
    });

  } catch (error) {
    console.error("SCAN ERROR 👉", error);
    return res.status(500).json({
      success: false,
      message: "Scan failed"
    });
  }
};
