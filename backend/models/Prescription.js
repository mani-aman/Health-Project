const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicines: [
      {
        name: String,
        dosage: String,
        duration: String,
        frequency: String,
      },
    ],
    notes: String,
    instructions: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
