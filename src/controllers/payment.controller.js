  import Ticket from "../models/Ticket.model.js";
  import {
    handlePaymentCallback as handlePaymentCallbackService,
    initiatePayment as initiatePaymentService,
  } from "../services/payment.service.js";
  import { env } from "../utils/envConfig.js";
  import { decryptAtom } from "../utils/atomAuth.js"; // 👈 Add this import
  import { encryptTicketData } from "../utils/qrSecurity.js";
  /**
   * POST /payment/initiate
   * Initiate payment for ticket purchase
   */
  export const initiatePayment = async (req, res) => {
    try {
      const { eventName, amount } = req.body;
      const userId = req.user.userId;

      if (!eventName || !amount) {
        return res.status(400).json({
          success: false,
          message: "Event name and amount are required",
        });
      }

      const result = await initiatePaymentService({
        userId,
        eventName,
        amount: parseFloat(amount),
      });

      return res.json({
        success: true,
        message: "Payment initiated successfully",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Payment initiation failed",
      });
    }
  };

  /**
   * POST /payment/callback
   * Handle payment gateway callback
   */
  export const handlePaymentCallback = async (req, res) => {
    try {
      const { encData } = req.body; 
      
      if (!encData) return res.status(400).send("No data received");
  
      const decryptedRaw = decryptAtom(encData);
      console.log("🏁 PAYMENT CALLBACK RECEIVED:", decryptedRaw);
  
      // FIX: Atom wraps everything in payInstrument
      const decrypted = decryptedRaw.payInstrument;
  
      if (!decrypted || !decrypted.responseDetails) {
          throw new Error("Invalid decryption or malformed response from Atom");
      }
  
      const { merchTxnId } = decrypted.merchDetails;
      const { statusCode } = decrypted.responseDetails;
  
      if (statusCode === "OTS0000") {
        const encryptedData = encryptTicketData({
            u: userId,              // Use short keys to keep QR less dense
            t: merchTxnId,          // Ticket ID
            e: "MES2026",           // Event code
            v: Date.now()           // Verification timestamp
        });
    
        await Ticket.findOneAndUpdate(
            { txnId: merchTxnId },
            { 
                paymentStatus: "SUCCESS", 
                qrData: encryptedData // 👈 Save the encrypted hash here
            }
        );
    }else {
        // ❌ PAYMENT FAILED
        await Ticket.findOneAndUpdate(
          { txnId: merchTxnId },
          { paymentStatus: "FAILED" }
        );
        return res.redirect(`${env.FRONTEND_URL}/student?status=failed`);
      }
    } catch (error) {
      console.error("Callback Error:", error);
      return res.redirect(`${env.FRONTEND_URL}/student?status=failed`);
    }
  };

  /**
   * GET /payment/status/:ticketId
   * Get payment status for a ticket
   */
  export const getPaymentStatus = async (req, res) => {
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

      return res.json({
        success: true,
        data: {
          ticketId: ticket._id,
          txnId: ticket.txnId,
          atomTxnId: ticket.atomTxnId,
          eventName: ticket.eventName,
          amount: ticket.amount,
          paymentStatus: ticket.paymentStatus,
          paymentMode: ticket.paymentMode,
          statusMessage: ticket.statusMessage,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        },
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment status",
      });
    }
  };
