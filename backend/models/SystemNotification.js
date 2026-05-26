const mongoose = require("mongoose");

const systemNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["announcement", "maintenance", "update", "alert"],
      default: "announcement",
    },
    targetRoles: [String], // ['doctor', 'patient', 'all']
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemNotification", systemNotificationSchema);
