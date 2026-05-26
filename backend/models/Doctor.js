const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    specialization: String,
    experience: Number,
    fees: Number,
    availability: {
      days: [String],
      slots: [String],
    },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending",
    },
    notifications: [
      {
        type: String,
        message: String,
        read: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Doctor", doctorSchema);
