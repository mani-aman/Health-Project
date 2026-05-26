const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true, // image/jpeg, application/pdf
    },
    size: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["report", "prescription", "scan", "lab-result", "other"],
      default: "report",
    },
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
