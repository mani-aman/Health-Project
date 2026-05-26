const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Symptom = require("../models/Symptom.model");
const MedicalHistory = require("../models/MedicalHistory.model");
const Workout = require("../models/workout.model");

// Admin Dashboard Stats
const dashboardStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalDoctors: await Doctor.countDocuments(),
      totalAppointments: await Appointment.countDocuments(),
      totalSymptoms: await Symptom.countDocuments(),
      pendingAppointments: await Appointment.countDocuments({
        status: "booked",
      }),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manage Doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select("-__v");
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const bcrypt = require("bcryptjs");

const createDoctor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      specialization,
      experience,
      fees,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !specialization) {
      return res.status(400).json({
        error:
          "Required fields: firstName, lastName, email, password, specialization",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Doctor with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User account with doctor role
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      role: "doctor",
      specialization,
      experience: experience || 0,
      status: "active",
    });

    // Create Doctor profile linked to User
    const doctor = await Doctor.create({
      userId: user._id,
      name: `Dr. ${firstName} ${lastName}`,
      specialization,
      experience: experience || 0,
      fees: fees || 0,
      // IMPORTANT: user panel only shows doctors with status="active"
      status: "active",
      availability: {
        days: req.body.availability?.days || [
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
        ],
        slots: req.body.availability?.slots || [
          "09:00 AM",
          "11:00 AM",
          "02:00 PM",
          "04:00 PM",
        ],
      },
    });

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor: {
        id: doctor._id,
        userId: user._id,
        name: doctor.name,
        email: user.email,
        specialization: doctor.specialization,
        credentials: {
          email: user.email,
          password: password, // Send back plaintext so admin can share with doctor
        },
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manage Appointments
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate("userId doctorId");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    ).populate("userId doctorId");
    if (!appointment)
      return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Manage Users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").select("-__v");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Sample doctors seed
const seedDoctors = async (req, res) => {
  try {
    await Doctor.deleteMany({});
    const sampleDoctors = [
      {
        name: "Dr. Smith",
        specialization: "Cardiologist",
        experience: 10,
        fees: 150,
      },
      {
        name: "Dr. Johnson",
        specialization: "General Physician",
        experience: 8,
        fees: 100,
      },
      {
        name: "Dr. Brown",
        specialization: "Orthopedist",
        experience: 12,
        fees: 200,
      },
    ];
    const doctors = await Doctor.insertMany(sampleDoctors);
    res.json({ message: "Sample doctors seeded", doctors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  dashboardStats,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllAppointments,
  updateAppointmentStatus,
  getUsers,
  updateUser,
  seedDoctors,
};
