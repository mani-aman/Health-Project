const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    symptoms: {
      type: String,
      required: true,
    },

    condition: {
      type: String,
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
    },

    advice: {
      type: String,
    },

    medicines: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Symptom", symptomSchema);
