  import Ticket from "../models/Ticket.model.js";
import {
  initiatePayment as initiatePaymentService,
} from "../services/payment.service.js";
import { env } from "../utils/envConfig.js";
import { decryptAtom } from "../utils/atomAuth.js";
import { encryptTicketData } from "../utils/qrSecurity.js";
import crypto from "crypto";
  /**
   * POST /payment/initiate
   * Initiate payment for ticket purchase
   */
  export const initiatePayment = async (req, res) => {
    try {
      const { eventName, amount } = req.body;
      const userId = req.userId;

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

  export const handlePaymentReturn = async (req, res) => {
    try {
      const { encData, txnId } = req.body;
      
      if (!encData) {
        return res.status(400).json({
          success: false,
          message: "Payment gateway response missing"
        });
      }

      try {
        decryptAtom(encData);
      } catch (decryptError) {
        console.error("Return URL decryption failed:", decryptError.message);
      }

      return res.redirect(`${env.FRONTEND_URL}/payment/success?txnId=${txnId}`);
    } catch (error) {
      console.error("Payment return error:", error);
      return res.redirect(`${env.FRONTEND_URL}/payment/failure`);
    }
  };


// added redirect handles for fixing the redirect  succsess pages

export const atomRedirectHandler = async (req, res) => {
  try {
    // Get transaction ID from Atom's query params
    const txnId = req.query.txnid || req.query.txnId || req.query.mer_txn;
    
    if (!txnId) {
      // No transaction ID, redirect to generic failure
      return res.redirect(`${env.FRONTEND_URL}/payment/failure`);
    }
 
    // Find the ticket to get its database ID
    const ticket = await Ticket.findOne({ txnId });
    console.log(ticket);
    
    if (!ticket) {
      // Ticket not found
      return res.redirect(`${env.FRONTEND_URL}/payment/failure`);
    }
 
    // Redirect to frontend with the ticket's database ID
    return res.redirect(
      console.log(ticket._id);
      `${env.FRONTEND_URL}/payment/success?ticketId=${ticket._id}`
    );
    
  } catch (error) {
    console.error("Redirect error:", error);
    return res.redirect(`${env.FRONTEND_URL}/payment/failure`);
  }
};
 
  export const handlePaymentCallback = async (req, res) => {
    try {
      const { encData } = req.body;
      
      if (!encData) {
        console.error("Callback received with no encData");
        return res.status(400).send("FAILED");
      }

      const decryptedRaw = decryptAtom(encData);
      if (!decryptedRaw || !decryptedRaw.payInstrument) {
        console.error("Decryption failed or invalid structure");
        return res.status(400).send("FAILED");
      }

      const payInstrument = decryptedRaw.payInstrument;
      const { merchDetails, payDetails, responseDetails, payModeSpecificData, extras } = payInstrument;

      if (!merchDetails || !payDetails || !responseDetails) {
        console.error("Missing required response fields");
        return res.status(400).send("FAILED");
      }

      const { merchTxnId } = merchDetails;
      // Check for signature in multiple possible locations (Atom might return it differently)
      let receivedSignature = payDetails.signature || payDetails.atomSignature || extras?.signature;
      const { atomTxnId } = payDetails;
      const { statusCode } = responseDetails;
      const userIdFromAtom = extras?.udf2;

      if (!merchTxnId || !atomTxnId) {
        console.error("Missing transaction identifiers");
        return res.status(400).send("FAILED");
      }

      if (statusCode === "OTS0000") {
        const totalAmount = parseFloat(payDetails.totalAmount).toFixed(2);
        const subChannel = Array.isArray(payModeSpecificData?.subChannel)
          ? payModeSpecificData.subChannel[0]
          : payModeSpecificData?.subChannel || "";
        const bankTxnId = payModeSpecificData?.bankDetails?.bankTxnId || "";

        const signatureString = [
          merchDetails.merchId.toString(),
          atomTxnId.toString(),
          merchTxnId.toString(),
          totalAmount,
          statusCode.toString(),
          subChannel.toString(),
          bankTxnId.toString()
        ].join("");

        const expectedSignature = crypto
          .createHmac("sha512", env.ATOM_RES_HASH_KEY)
          .update(signatureString)
          .digest("hex");

        let signatureVerified = false;

        if (receivedSignature) {
          if (expectedSignature === receivedSignature) {
            signatureVerified = true;
            console.log("Signature verification passed");
          } else {
            console.error("Signature verification failed", {
              expected: expectedSignature,
              received: receivedSignature
            });
            signatureVerified = false;
          }
        } else {
          console.warn("No signature received from Atom gateway - proceeding without verification");
        }

        const encryptedQrData = encryptTicketData({
          u: userIdFromAtom,
          t: merchTxnId,
          e: "MES2026",
          v: Date.now()
        });

        const updateResult = await Ticket.findOneAndUpdate(
          { txnId: merchTxnId },
          {
            paymentStatus: "SUCCESS",
            qrData: encryptedQrData,
            atomTxnId: atomTxnId,
            statusCode: statusCode,
            paymentMode: subChannel,
            signatureVerified: signatureVerified
          },
          { new: true }
        );

        if (!updateResult) {
          console.error("Ticket not found for update:", merchTxnId);
          return res.status(404).send("FAILED");
        }

        console.log("Payment successful and ticket updated:", merchTxnId);
        return res.send("OK");
      } else {
        const updateResult = await Ticket.findOneAndUpdate(
          { txnId: merchTxnId },
          {
            paymentStatus: "FAILED",
            statusCode: statusCode,
            signatureVerified: false
          },
          { new: true }
        );

        if (!updateResult) {
          console.error("Ticket not found for failure update:", merchTxnId);
          return res.status(404).send("FAILED");
        }

        console.log("Payment failed:", statusCode);
        return res.send("OK");
      }
    } catch (error) {
      console.error("Callback processing error:", error.message);
      return res.status(500).send("FAILED");
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
