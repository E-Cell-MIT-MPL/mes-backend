import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  regNo: { type: String, unique: true, required: true },
  phone: { type: String, required: true }
});

export default mongoose.model("Student", studentSchema);
