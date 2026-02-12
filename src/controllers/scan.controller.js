import Ticket from "../models/Ticket.model.js";
import { decryptTicketData } from "../utils/qrSecurity.js";
import { serverLogger } from "../server.js";

// 👇 Helper function to dynamically check if user is MAHE based on email
const getRole = (user) => {
    if (user?.learnerEmail && user.learnerEmail.includes("@learner.manipal.edu")) {
        return "MAHE STUDENT";
    }
    return "NON-MAHE";
};

export const scanTicket = async (req, res) => {
  try {
    // Expected body: { encryptedQR: "iv:encrypted_data" }
    const { encryptedQR } = req.body;

    if (!encryptedQR) {
      return res.status(400).json({ success: false, message: "QR data missing" });
    }

    // Decrypt QR data
    const decryptedData = decryptTicketData(encryptedQR);

    if (!decryptedData || !decryptedData.t) {
      return res.status(400).json({ success: false, message: "Invalid or tampered QR" });
    }

    // Extract ticket info from decrypted payload
    const { t: txnId } = decryptedData;

    if (!txnId) {
      return res.status(400).json({ success: false, message: "Invalid QR payload" });
    }

    // Fetch ticket by transaction ID
    const ticket = await Ticket.findOne({ txnId }).populate("userId");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // --- NEW LOGIC: DAILY CHECK-IN ---
    const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

    // 2. Check if this ticket has ALREADY been scanned TODAY
    // (Commented out for unlimited testing as requested)
    const alreadyScannedToday = ticket.entryHistory && ticket.entryHistory.some(
      (entry) => entry.dateString === today
    );

    if (alreadyScannedToday) {
      return res.status(409).json({
        success: false,
        message: `Ticket already used today (${today})`,
        usedAt: ticket.usedAt, 
      });
    }

    // --- MARK ATTENDANCE ---
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.usedBy = req.headers["x-device"] || "scanner";

    // Push to New History Array
    ticket.entryHistory.push({
      timestamp: new Date(),
      scannedBy: req.headers["x-device"] || "scanner",
      dateString: today 
    });

    await ticket.save();

    // Success response
    return res.json({
      success: true,
      message: "ENTRY ALLOWED",
      attendee: {
        name: ticket.userId.name,
        email: ticket.userId.learnerEmail || ticket.userId.personalEmail || null,
      },
      eventName: ticket.eventName,
      scannedAt: ticket.usedAt,
      day: today, 
      ticketId: ticket.txnId,                       // 🟢 Ticket Transaction ID
      regNumber: ticket.userId?.regNumber || "N/A", // 🟢 Actual Registration Number
      role: getRole(ticket.userId)                  // 🟢 Role calculation
    });

  } catch (error) {
    serverLogger.error("Scan Ticket Error:", error);
    return res.status(500).json({ success: false, message: "Scan failed" });
  }
};

// --- GET SCAN HISTORY ---
export const getScanHistory = async (req, res) => {
  try {
    // 🟢 Added 'regNumber' to populate array
    const tickets = await Ticket.find({ 
        "entryHistory.0": { $exists: true } 
    }).populate("userId", "name learnerEmail personalEmail regNumber");

    let historyLog = [];

    tickets.forEach(ticket => {
        ticket.entryHistory.forEach(entry => {
            historyLog.push({
                id: ticket.txnId,
                ticketId: ticket.txnId,
                regNumber: ticket.userId?.regNumber || "N/A", // 🟢 Added
                role: getRole(ticket.userId),                 // 🟢 Added
                name: ticket.userId?.name || "Unknown",
                email: ticket.userId?.learnerEmail || ticket.userId?.personalEmail || "N/A",
                time: new Date(entry.timestamp).toLocaleString("en-IN", { 
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" 
                }),
                gate: entry.dateString || "Unknown Day", 
                status: "ENTRY ALLOWED",
                rawTime: new Date(entry.timestamp) 
            });
        });
    });

    // Sort by Newest First
    historyLog.sort((a, b) => b.rawTime - a.rawTime);

    res.json({
        success: true,
        data: historyLog
    });

  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- GET DASHBOARD STATS ---
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Tickets SOLD
    const totalSold = await Ticket.countDocuments({ 
        paymentStatus: "SUCCESS" 
    });
    
    // 2. Total Checked In
    const checkedInCount = await Ticket.countDocuments({ 
        "entryHistory.0": { $exists: true },
        paymentStatus: "SUCCESS"
    });
    
    // 3. Pending
    const pendingCount = totalSold - checkedInCount;

    // 4. Recent Entries (Get latest 5)
    // 🟢 Added 'regNumber' and 'learnerEmail' here too
    const recentTickets = await Ticket.find({ 
        "entryHistory.0": { $exists: true },
        paymentStatus: "SUCCESS"
    })
      .sort({ "updatedAt": -1 }) 
      .limit(5)
      .populate("userId", "name regNumber learnerEmail"); 

    const recentEntries = recentTickets.map(t => {
       const lastEntry = t.entryHistory[t.entryHistory.length - 1];
       return {
          id: t.txnId,
          regNumber: t.userId?.regNumber || "N/A", // 🟢 Used for Recent Scans block
          role: getRole(t.userId),                 
          name: t.userId?.name || "Unknown",
          time: new Date(lastEntry.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' }),
          gate: lastEntry.dateString,
          status: "ENTRY ALLOWED"
       };
    });

    res.json({
      success: true,
      stats: {
        total: totalSold,
        checkedIn: checkedInCount,
        pending: pendingCount
      },
      recent: recentEntries
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ success: false, message: "Stats Error" });
  }
};
