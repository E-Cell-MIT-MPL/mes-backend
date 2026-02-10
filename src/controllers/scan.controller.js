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
    // const alreadyScannedToday = ticket.entryHistory && ticket.entryHistory.some(
    //   (entry) => entry.dateString === today
    // );

    // if (alreadyScannedToday) {
    //   return res.status(409).json({
    //     success: false,
    //     message: `Ticket already used today (${today})`,
    //     usedAt: ticket.usedAt, // Returns the last scan time
    //   });
    // }

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

// ... existing imports and functions ...

// 👇 ADD THIS NEW FUNCTION
export const getScanHistory = async (req, res) => {
  try {
    // 1. Find all tickets that have at least one entry
    const tickets = await Ticket.find({ 
        "entryHistory.0": { $exists: true } 
    }).populate("userId", "name learnerEmail personalEmail");

    // 2. Flatten the history (User scanned 3 times = 3 rows in table)
    let historyLog = [];

    tickets.forEach(ticket => {
        ticket.entryHistory.forEach(entry => {
            historyLog.push({
                id: ticket.txnId,
                name: ticket.userId?.name || "Unknown",
                email: ticket.userId?.learnerEmail || ticket.userId?.personalEmail || "N/A",
                time: new Date(entry.timestamp).toLocaleString("en-IN", { 
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" 
                }),
                gate: entry.dateString || "Unknown Day", // "Day 1", "Day 2"
                status: "Entry Allowed",
                rawTime: new Date(entry.timestamp) // For sorting
            });
        });
    });

    // 3. Sort by Newest First
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

// ... (Your existing scanTicket function is here. LEAVE IT ALONE.) ...

// 👇 ADD THIS NEW FUNCTION AT THE BOTTOM
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Tickets SOLD (Only Success)
    const totalSold = await Ticket.countDocuments({ 
        paymentStatus: "SUCCESS" 
    });
    
    // 2. Total Checked In (Has entry history AND was a success)
    const checkedInCount = await Ticket.countDocuments({ 
        "entryHistory.0": { $exists: true },
        paymentStatus: "SUCCESS"
    });
    
    // 3. Pending
    const pendingCount = totalSold - checkedInCount;

    // 4. Recent Entries (Get latest 5)
    const recentTickets = await Ticket.find({ 
        "entryHistory.0": { $exists: true },
        paymentStatus: "SUCCESS"
    })
      .sort({ "updatedAt": -1 }) 
      .limit(5)
      .populate("userId", "name");

    const recentEntries = recentTickets.map(t => {
       const lastEntry = t.entryHistory[t.entryHistory.length - 1];
       return {
          id: t.txnId,
          name: t.userId?.name || "Unknown",
          time: new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gate: lastEntry.dateString,
          status: "Entry Allowed"
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