import fetch from "node-fetch";
import { encrypt, decrypt } from "../utils/atomCrypto.js";

/* -------------------------------------------------
   INITIATE PAYMENT (ATOM AUTH)
-------------------------------------------------- */
export const initiatePayment = async (req, res) => {
  try {
    const { amount, email, mobile } = req.body;

    if (!amount || !email || !mobile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const txnId = `TXN_${Date.now()}`;
    const txnDate = new Date().toISOString().slice(0, 19).replace("T", " ");

    const payload = {
      payInstrument: {
        headDetails: {
          version: "OTSv1.1",
          api: "AUTH",
          platform: "FLASH",
        },
        merchDetails: {
          merchId: process.env.ATOM_MERCH_ID,
          userId: "",
          password: process.env.ATOM_MERCH_PASS,
          merchTxnId: txnId,
          merchTxnDate: txnDate,
        },
        payDetails: {
          amount,
          product: process.env.ATOM_PROD_ID,
          custAccNo: "NA",
          txnCurrency: "INR",
        },
        custDetails: {
          custEmail: email,
          custMobile: mobile,
        },
      },
    };

    const encData = encrypt(JSON.stringify(payload));

    const response = await fetch(process.env.ATOM_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        encData,
        merchId: process.env.ATOM_MERCH_ID,
      }),
    });

    const text = await response.text();

    if (!text.includes("encData")) {
      console.error("Invalid ATOM response:", text);
      return res.status(500).json({ error: "Invalid gateway response" });
    }

    const encResp = text.split("&")[1].split("=")[1];
    const decrypted = JSON.parse(decrypt(encResp));

    console.log("ATOM AUTH RESPONSE:", decrypted);

    if (decrypted.responseDetails.txnStatusCode !== "OTS0000") {
      return res.status(400).json({
        error: "AUTH FAILED",
        code: decrypted.responseDetails.txnStatusCode,
      });
    }

    // TODO: Save transaction in DB (status = INITIATED)

    return res.json({
      atomTokenId: decrypted.atomTokenId,
      txnId,
      merchId: process.env.ATOM_MERCH_ID,
      paymentUrl: process.env.ATOM_PAYMENT_URL,
    });
  } catch (err) {
    console.error("INITIATE PAYMENT ERROR:", err);
    return res.status(500).json({ error: "Payment init failed" });
  }
};

/* -------------------------------------------------
   ATOM PAYMENT RESPONSE CALLBACK
-------------------------------------------------- */
export const paymentResponse = (req, res) => {
  try {
    if (!req.body.encData) {
      console.error("No encData received from ATOM");
      return res.redirect("http://localhost:3000/payment-failed");
    }

    const decrypted = JSON.parse(decrypt(req.body.encData));
    console.log("ATOM CALLBACK RESPONSE:", decrypted);

    const status = decrypted?.responseDetails?.statusCode;

    if (status === "OTS0000") {
      // TODO: Update transaction status = SUCCESS
      return res.redirect("http://localhost:3000/payment-success");
    } else {
      // TODO: Update transaction status = FAILED
      return res.redirect("http://localhost:3000/payment-failed");
    }
  } catch (err) {
    console.error("ATOM CALLBACK ERROR:", err);
    return res.redirect("http://localhost:3000/payment-failed");
  }
};
