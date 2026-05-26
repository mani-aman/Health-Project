const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Doctors are also Users
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    verified: {
      type: Boolean,
      default: true, // Verified via appointment
    },
  },
  { timestamps: true },
);

// Compound index to prevent duplicate reviews per appt-user
reviewSchema.index({ userId: 1, appointmentId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
