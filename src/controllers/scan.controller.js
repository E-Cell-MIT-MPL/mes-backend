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

    // --- NEW LOGIC: DAILY CHECK-IN ---

    // 1. Get current date string in IST (e.g., "12/2/2026")
    // This ensures that even if scanned at 1 AM, it counts for the correct local day
    const today = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    // 2. Check if this ticket has ALREADY been scanned TODAY
    // We look inside the new entryHistory array
    const alreadyScannedToday = ticket.entryHistory && ticket.entryHistory.some(
      (entry) => entry.dateString === today
    );

    if (alreadyScannedToday) {
      return res.status(409).json({
        success: false,
        message: `Ticket already used today (${today})`,
        usedAt: ticket.usedAt, // Returns the last scan time
      });
    }

    // --- MARK ATTENDANCE ---

    // 3. Update Legacy Fields (Keeps old admin dashboards working)
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.usedBy = req.headers["x-device"] || "scanner";

    // 4. Push to New History Array (Tracks specific day entry)
    ticket.entryHistory.push({
      timestamp: new Date(),
      scannedBy: req.headers["x-device"] || "scanner",
      dateString: today // Stores "12/2/2026" or "14/2/2026"
    });

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
      day: today, // Optional: helps frontend display "Day 1" etc.
    });

  } catch (error) {
    serverLogger.error("Scan Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Scan failed",
    });
  }
};