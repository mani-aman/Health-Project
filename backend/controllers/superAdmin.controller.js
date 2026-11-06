/**
 * Super Admin Controller
 *
 * Super Admin accounts are created only by Protected Admin.
 * Super Admin has:
 *   - Full Doctor management (create/edit/delete/activate)
 *   - Read access to all medical records (logged)
 *   - View all appointments
 *   - View all users (read-only)
 *
 * Super Admin CANNOT:
 *   - Create another Super Admin
 *   - Create Protected Admin
 *   - Delete users
 *   - Access Protected Admin routes
 */

const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const MedicalHistory = require("../models/MedicalHistory.model");
const Prescription = require("../models/Prescription");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const { normalizeRole } = require("../middleware/auth.middleware");

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

exports.dashboardStats = async (req, res) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments, totalRecords] =
      await Promise.all([
        Doctor.countDocuments(),
        User.countDocuments({ role: { $in: ["user", "patient"] } }),
        Appointment.countDocuments(),
        MedicalRecord.countDocuments(),
      ]);

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalRecords,
      appointmentsByStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Doctor Management ───────────────────────────────────────────────────────

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "firstName lastName email mobile status createdAt")
      .select("-__v")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDoctor = async (req, res) => {
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
      availability,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !specialization) {
      return res.status(400).json({
        error: "firstName, lastName, email, password, specialization are required",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      mobile,
      password: hashedPassword,
      role: "doctor",
      status: "active",
      createdBy: req.user._id,
    });

    const doctor = await Doctor.create({
      userId: user._id,
      name: `Dr. ${firstName} ${lastName}`,
      specialization,
      experience: Number(experience) || 0,
      fees: Number(fees) || 0,
      status: "active",
      availability: availability || {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
      },
    });

    // Audit log
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "doctor_create",
      targetId: user._id,
      targetType: "User",
      details: { email: user.email, name: doctor.name },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor: {
        id: doctor._id,
        userId: user._id,
        name: doctor.name,
        email: user.email,
        specialization: doctor.specialization,
        status: doctor.status,
        // NOTE: password is NOT included in response
      },
    });
  } catch (err) {
    console.error("createDoctor error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const allowedFields = [
      "name", "specialization", "experience", "fees", "availability", "status",
    ];
    const update = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    // If status changed, also update the User account
    if (update.status && doctor.userId) {
      const userStatus = update.status === "active" ? "active" : "inactive";
      await User.findByIdAndUpdate(doctor.userId, { status: userStatus });
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "doctor_update",
      targetId: doctor._id,
      targetType: "Doctor",
      details: update,
      ipAddress: req.ip,
    });

    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    // Soft-delete user account instead of hard delete to preserve appointment history
    if (doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, { status: "inactive" });
    }
    await Doctor.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "doctor_delete",
      targetId: doctor._id,
      targetType: "Doctor",
      details: { name: doctor.name },
      ipAddress: req.ip,
    });

    res.json({ message: "Doctor deleted and account deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Medical Records (read-only, logged) ─────────────────────────────────────

exports.getAllMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const query = userId ? { userId } : {};

    const records = await MedicalRecord.find(query)
      .populate("userId", "firstName lastName email")
      .populate("uploadedBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments(query);

    // Log the access
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "medical_records_access",
      targetType: "MedicalRecord",
      details: { query: { userId, page, limit }, count: records.length },
      ipAddress: req.ip,
    });

    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Appointments ─────────────────────────────────────────────────────────────

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("userId", "firstName lastName email")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Users (read-only) ────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["user", "patient"] } })
      .select("-password -__v")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
