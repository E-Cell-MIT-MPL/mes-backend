import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["MIT", "NON_MIT"],
      required: true,
    },

    name: { type: String, required: true },

    regNumber: {
      type: String,
      unique: true,
      sparse: true, // only for MIT
    },

    learnerEmail: {
      type: String,
      unique: true,
      sparse: true,
    },

    personalEmail: {
      type: String,
      unique: true,
      required: true,
    },

    phone: {
      type: String,
      unique: true,
      required: true,
    },

    password: { type: String, required: true },

    isVerified: { type: Boolean, default: false },

    referrerTag: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
