import { Router } from "express";
import crypto from "crypto";

import Ticket from "../models/Ticket.model.js";
import { decryptAtom } from "../utils/atomAuth.js";
import { env } from "../utils/envConfig.js";
import { encryptTicketData } from "../utils/qrSecurity.js";

const router = Router();

router.post("/response", async (req, res) => {
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
    const {
      merchDetails,
      payDetails,
      responseDetails,
      payModeSpecificData,
      extras,
    } = payInstrument;

    if (!merchDetails || !payDetails || !responseDetails) {
      console.error("Missing required response fields");
      return res.status(400).send("FAILED");
    }

    const { merchTxnId } = merchDetails;
    const { atomTxnId, signature } = payDetails;
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
        bankTxnId.toString(),
      ].join("");

      const expectedSignature = crypto
        .createHmac("sha512", env.ATOM_RES_HASH_KEY)
        .update(signatureString)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("Signature verification failed", {
          expected: expectedSignature,
          received: signature,
        });
        return res.status(400).send("FAILED");
      }

      const encryptedQrData = encryptTicketData({
        u: userIdFromAtom,
        t: merchTxnId,
        e: "MES2026",
        v: Date.now(),
      });

      const updateResult = await Ticket.findOneAndUpdate(
        { txnId: merchTxnId },
        {
          paymentStatus: "SUCCESS",
          qrData: encryptedQrData,
          atomTxnId: atomTxnId,
          statusCode: statusCode,
          paymentMode: subChannel,
          signatureVerified: true,
        },
        { new: true },
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
          signatureVerified: false,
        },
        { new: true },
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
});

export default router;
