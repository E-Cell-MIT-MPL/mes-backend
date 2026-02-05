import Ticket from "../models/Ticket.model.js";
import { decryptTicketData } from "../utils/qrSecurity.js";
import { serverLogger } from "../server.js";

export const scanTicket = async (req, res) => {
  try {
    // Expected body: { encryptedQR: "iv:encrypted_data" }
    const { encryptedQR } = req.body;

    if (!encryptedQR) {
      return res.status(400).json({
        success: false,
        message: "QR data missing",
      });
    }

    // Decrypt QR data
    const decryptedData = decryptTicketData(encryptedQR);

    if (!decryptedData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or tampered QR",
      });
    }

    // Extract ticket info from decrypted payload
    // Payload structure: { u: userId, t: txnId, e: eventCode, v: timestamp }
    const { t: txnId } = decryptedData;

    if (!txnId) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR payload",
      });
    }

    // Fetch ticket by transaction ID
    const ticket = await Ticket.findOne({ txnId }).populate("userId");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Block re-entry
    if (ticket.isUsed) {
      return res.status(409).json({
        success: false,
        message: "Ticket already used",
        usedAt: ticket.usedAt,
      });
    }

    // Mark attendance
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.usedBy = req.headers["x-device"] || "scanner";
    await ticket.save();

    // Success response
    return res.json({
      success: true,
      message: "ENTRY ALLOWED",
      attendee: {
        name: ticket.userId.name,
        email:
          ticket.userId.learnerEmail || ticket.userId.personalEmail || null,
      },
      eventName: ticket.eventName,
      scannedAt: ticket.usedAt,
    });
  } catch (error) {
    serverLogger.error("Scan Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Scan failed",
    });
  }
};
