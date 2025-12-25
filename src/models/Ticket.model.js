import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  eventName: { type: String, required: true },
  qrData: { type: String, required: true }, // We will save the JSON string here
  isPaid: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);