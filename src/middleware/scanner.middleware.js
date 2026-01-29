import Ticket from "../models/Ticket.model.js";
import { verifyQR } from "../config/qr.js";

export const scanTicket = async (req, res) => {
  try {
    const qrPayload = req.body;

    if (!verifyQR(qrPayload)) {
      return res.status(400).json({ message: "Invalid QR" });
    }

    const ticket = await Ticket.findById(qrPayload.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.isUsed) {
      return res.status(409).json({
        message: "Already used",
        usedAt: ticket.usedAt,
      });
    }

    // MARK ENTRY (ATOMIC)
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.usedBy = req.headers["x-device"] || "scanner";
    await ticket.save();

    return res.json({
      success: true,
      name: qrPayload.name,
      regNumber: qrPayload.regNumber,
      eventName: qrPayload.eventName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Scan failed" });
  }
};
