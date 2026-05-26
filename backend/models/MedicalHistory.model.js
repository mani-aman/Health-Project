const mongoose = require("mongoose");

const medicalHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bloodGroup: String,
    allergies: [String],
    chronicDiseases: [String],
    medications: [String],
  },
  { timestamps: true },
);

module.exports = mongoose.model("MedicalHistory", medicalHistorySchema);
