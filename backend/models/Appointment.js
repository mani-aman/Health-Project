const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    date: String,
    time: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    confirmedByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
