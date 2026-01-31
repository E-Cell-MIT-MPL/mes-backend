import Ticket from "../models/Ticket.model.js";
import crypto from 'crypto';
import {
  handlePaymentCallback as handlePaymentCallbackService,
  initiatePayment as initiatePaymentService,
} from "../services/payment.service.js";
import { env } from "../utils/envConfig.js";

/**
 * POST /payment/initiate
 * Initiate payment for ticket purchase
 */
// services/payment.service.js



export const initiatePayment = async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] [PAYMENT_INITIATE_START] User: ${req.user.userId} Amt: ${req.body.amount}`);

  try {
    const { eventName, amount } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!eventName || !amount) {
      console.warn(`[${requestId}] [VALIDATION_FAILED] Missing eventName or amount`);
      return res.status(400).json({
        success: false,
        message: "Event name and amount are required",
      });
    }

    // Call Service Layer
    // This performs: DB Create -> Atom Auth Request -> Token Receipt
    const result = await initiatePaymentService({
      userId,
      eventName,
      amount: parseFloat(amount),
    });

    console.log(`[${requestId}] [PAYMENT_INITIATE_SUCCESS] Token Received: ${result.atomTokenId}`);

    return res.json({
      success: true,
      message: "Handshake successful. Redirecting to gateway...",
      data: result,
    });

  } catch (error) {
    // CRITICAL: Log the full error to your server console
    console.error(`[${requestId}] [PAYMENT_INITIATE_FATAL]:`, {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || "No additional gateway details"
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error during payment initiation",
      // Include error detail only in development for easier debugging at MIT
      error_detail: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    if (!encData) {
      return res.redirect(
        `${env.FRONTEND_URL}/payment/failure?error=invalid_response`,
      );
    }

    const result = await handlePaymentCallbackService(encData);

    // Redirect to frontend based on status
    if (result.success) {
      return res.redirect(
        `${env.FRONTEND_URL}/payment/success?ticketId=${result.ticketId}&txnId=${result.txnId}`,
      );
    } else {
      return res.redirect(
        `${env.FRONTEND_URL}/payment/failure?ticketId=${result.ticketId}&error=${encodeURIComponent(result.statusMessage)}`,
      );
    }
  } catch {
    return res.redirect(
      `${env.FRONTEND_URL}/payment/failure?error=processing_failed`,
    );
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
