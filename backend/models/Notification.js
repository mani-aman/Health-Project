const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    type: {
      type: String,
      enum: ["appointment", "prescription", "review", "message", "reminder"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: mongoose.Schema.Types.Mixed, // extra data like status change
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
