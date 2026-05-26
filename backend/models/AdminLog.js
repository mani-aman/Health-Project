const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // 'doctor_approved', 'appointment_cancelled', 'user_blocked'
      enum: [
        "login",
        "doctor_create",
        "doctor_update",
        "doctor_delete",
        "doctor_approve",
        "patient_block",
        "appointment_cancel",
        "review_delete",
        "system_setting",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // doctorId, userId, etc.
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    success: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
