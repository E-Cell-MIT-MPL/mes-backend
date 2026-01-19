import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    eventName: {
      type: String,
      required: true
    },

    qrData: {
      type: String,
      required: true
    },

    isPaid: {
      type: Boolean,
      default: true
    },

    // ✅ SCANNER / ATTENDANCE
    isUsed: {
      type: Boolean,
      default: false
    },

    usedAt: {
      type: Date
    },

    usedBy: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
