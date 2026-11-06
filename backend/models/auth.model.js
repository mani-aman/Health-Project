const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: { type: String, trim: true },
    password: { type: String, required: true },

    // Four RBAC roles.
    // Legacy values 'admin' and 'patient' kept so existing DB records still validate.
    role: {
      type: String,
      enum: [
        "protected_admin",
        "super_admin",
        "doctor",
        "user",
        // Legacy – kept for backward compatibility during migration
        "admin",
        "patient",
      ],
      default: "user",
    },

    status: {
      type: String,
      enum: ["pending", "active", "blocked", "inactive"],
      default: "active",
    },

    // Who created this account (admins track creation chain)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Doctor-specific fields (populated when role=doctor)
    specialization: { type: String, trim: true },
    experience: Number,

    // Patient/User health profile
    healthProfile: {
      age: Number,
      height: Number, // cm
      weight: Number, // kg
      bmi: Number,
      goal: String,
      allergies: [String],
      chronicDiseases: [String],
      medicalHistory: [
        {
          condition: String,
          diagnosedDate: Date,
          notes: String,
        },
      ],
      bloodGroup: String,
      emergencies: {
        contactName: String,
        contactPhone: String,
      },
      lastCheckup: Date,
    },
  },
  { timestamps: true },
);

// Index for fast role-based queries
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model("User", userSchema);
