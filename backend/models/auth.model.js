const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: String,
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "doctor", "patient"],
      default: "patient",
    },
    status: {
      type: String,
      enum: ["pending", "active", "blocked", "inactive"],
      default: "active",
    },
    // doctor fields
    specialization: String,
    experience: Number,
    healthProfile: {
      age: Number,
      height: Number, // cm
      weight: Number, // kg
      bmi: Number,
      goal: String, // weight loss/gain/maintain
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

module.exports = mongoose.model("User", userSchema);
