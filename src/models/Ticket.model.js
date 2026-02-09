import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referrerTag: {
      type: String,
      default: null,
    },

    eventName: {
      type: String,
      required: true,
    },

    qrData: {
      type: String,
      required: true,
    },

    // Payment Details
    txnId: {
      type: String,
      unique: true,
      sparse: true, // Allows null for backward compatibility
    },
    atomTxnId: {
      type: String,
      default: null,
    },
    atomTokenId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    paymentMode: {
      type: String,
      default: null,
    },
    statusCode: {
      type: String,
      default: null,
    },
    statusMessage: {
      type: String,
      default: null,
    },
    signature: {
      type: String,
      default: null,
    },
    signatureVerified: {
      type: Boolean,
      default: false,
    },
    rawResponse: {
      type: Object,
      default: null,
    },

    // SCANNER / ATTENDANCE
    isUsed: {
      type: Boolean,
      default: false,
    },
    //just added on 7th feb
    entryHistory: [{
        timestamp: { type: Date, default: Date.now },
        scannedBy: { type: String },
        dateString: { type: String } // Stores "DD/MM/YYYY" for easy matching
    }],

    usedAt: {
      type: Date,
    },

    usedBy: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", ticketSchema);
