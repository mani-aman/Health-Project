const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    bmi: {
      type: Number,
      required: true,
    },
    plan: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Workout", workoutSchema);
