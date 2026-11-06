const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "signup",
        // Account lifecycle
        "account_create",
        "account_update",
        "account_delete",
        "account_activate",
        "account_deactivate",
        "account_block",
        // Doctor management
        "doctor_create",
        "doctor_update",
        "doctor_delete",
        "doctor_approve",
        // Super Admin management
        "super_admin_create",
        "super_admin_delete",
        "super_admin_update",
        // Medical data
        "medical_records_access",
        "medical_record_view",
        "medical_record_upload",
        "medical_record_delete",
        // Appointments
        "appointment_create",
        "appointment_update",
        "appointment_cancel",
        // System
        "system_setting",
        "password_reset",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetType: {
      type: String,
      default: null,
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

// Indexes for efficient log queries
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
