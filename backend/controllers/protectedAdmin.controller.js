/**
 * Protected Admin Controller
 *
 * Protected Admin is the highest authority. Only one account exists.
 * Created exclusively via the bootstrap mechanism (env vars).
 *
 * Capabilities:
 *   - Full user management (view, edit, activate/deactivate, delete)
 *   - Doctor management (create/edit/delete/activate)
 *   - Super Admin management (create/view/edit/delete)
 *   - Medical records access (all, logged)
 *   - System management (analytics, audit logs)
 *
 * Cannot:
 *   - Create another Protected Admin
 *   - Delete the last Protected Admin
 */

const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

exports.dashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalSuperAdmins,
      totalAppointments,
      totalRecords,
      activeAccounts,
      inactiveAccounts,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ["user", "patient"] } }),
      Doctor.countDocuments(),
      User.countDocuments({ role: "super_admin" }),
      Appointment.countDocuments(),
      MedicalRecord.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: { $in: ["inactive", "blocked"] } }),
    ]);

    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("actorId", "firstName lastName email role");

    res.json({
      totalUsers,
      totalDoctors,
      totalSuperAdmins,
      totalAppointments,
      totalRecords,
      activeAccounts,
      inactiveAccounts,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── User Management ─────────────────────────────────────────────────────────

exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    else query.role = { $in: ["user", "patient"] };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Prevent role escalation through mass assignment
    const allowedFields = ["firstName", "lastName", "mobile", "status"];
    const update = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "account_update",
      targetId: user._id,
      targetType: "User",
      details: update,
      ipAddress: req.ip,
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });

    // Prevent deleting protected_admin
    if (
      target.role === "protected_admin" ||
      target.role === "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Protected Admin accounts cannot be deleted through the API" });
    }

    // Soft delete — preserve medical record history
    await User.findByIdAndUpdate(req.params.id, { status: "inactive" });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "account_delete",
      targetId: target._id,
      targetType: "User",
      details: { email: target.email, role: target.role },
      ipAddress: req.ip,
    });

    res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "blocked", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });

    if (target.role === "protected_admin" || target.role === "admin") {
      // Guard: never block the last protected_admin
      const adminCount = await User.countDocuments({
        role: { $in: ["protected_admin", "admin"] },
        status: "active",
      });
      if (adminCount <= 1 && status !== "active") {
        return res.status(403).json({
          error: "Cannot deactivate the last active Protected Admin",
        });
      }
    }

    await User.findByIdAndUpdate(req.params.id, { status });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: status === "active" ? "account_activate" : "account_deactivate",
      targetId: target._id,
      targetType: "User",
      details: { email: target.email, newStatus: status },
      ipAddress: req.ip,
    });

    res.json({ message: `Account ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Doctor Management ────────────────────────────────────────────────────────

exports.getDoctors = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }
    const doctors = await Doctor.find(query)
      .populate("userId", "firstName lastName email mobile status createdBy createdAt")
      .select("-__v")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password, specialization, experience, fees, availability } = req.body;

    if (!firstName || !lastName || !email || !password || !specialization) {
      return res.status(400).json({ error: "firstName, lastName, email, password, specialization required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);

    // For Protected Admin (env-based, not in MongoDB), use createdBy: null
    // For Super Admin (real MongoDB user), use createdBy: req.user._id
    const createdBy = req.user._id === "protected-admin-env" ? null : req.user._id;

    const user = await User.create({
      firstName, lastName,
      email: email.toLowerCase().trim(),
      mobile,
      password: hashedPassword,
      role: "doctor",
      status: "active",
      createdBy,
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

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "doctor_create",
      targetId: user._id, targetType: "User",
      details: { email: user.email, name: doctor.name }, ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Doctor created",
      doctor: { id: doctor._id, userId: user._id, name: doctor.name, email: user.email, specialization: doctor.specialization },
    });
  } catch (err) {
    console.error("createDoctor:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const allowed = ["name", "specialization", "experience", "fees", "availability", "status"];
    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    if (update.status && doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, {
        status: update.status === "active" ? "active" : "inactive",
      });
    }

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "doctor_update",
      targetId: doctor._id, targetType: "Doctor", details: update, ipAddress: req.ip,
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

    if (doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, { status: "inactive" });
    }
    await Doctor.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "doctor_delete",
      targetId: doctor._id, targetType: "Doctor", details: { name: doctor.name }, ipAddress: req.ip,
    });

    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Super Admin Management (Protected Admin only) ────────────────────────────

exports.getSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await User.find({ role: "super_admin" })
      .select("-password -__v")
      .sort({ createdAt: -1 });
    res.json(superAdmins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSuperAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "firstName, lastName, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);

    // For Protected Admin (env-based, not in MongoDB), use createdBy: null
    // For Super Admin (real MongoDB user), use createdBy: req.user._id
    const createdBy = req.user._id === "protected-admin-env" ? null : req.user._id;

    const superAdmin = await User.create({
      firstName, lastName,
      email: email.toLowerCase().trim(),
      mobile,
      password: hashedPassword,
      role: "super_admin",
      status: "active",
      createdBy,
    });

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "super_admin_create",
      targetId: superAdmin._id, targetType: "User",
      details: { email: superAdmin.email }, ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Super Admin created",
      user: {
        id: superAdmin._id,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (err) {
    console.error("createSuperAdmin:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateSuperAdmin = async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "mobile", "status"];
    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "super_admin" },
      update,
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ error: "Super Admin not found" });

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "super_admin_update",
      targetId: user._id, targetType: "User", details: update, ipAddress: req.ip,
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSuperAdmin = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "super_admin" },
      { status: "inactive" },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "Super Admin not found" });

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "super_admin_delete",
      targetId: user._id, targetType: "User",
      details: { email: user.email }, ipAddress: req.ip,
    });

    res.json({ message: "Super Admin deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Medical Records ──────────────────────────────────────────────────────────

exports.getAllMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, search } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (search) query.filename = { $regex: search, $options: "i" };

    const records = await MedicalRecord.find(query)
      .populate("userId", "firstName lastName email")
      .populate("uploadedBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments(query);

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: "medical_records_access",
      targetType: "MedicalRecord", details: { query: { userId, page }, count: records.length }, ipAddress: req.ip,
    });

    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── System / Audit Logs ──────────────────────────────────────────────────────

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, actorId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (actorId) query.actorId = actorId;

    const logs = await AuditLog.find(query)
      .populate("actorId", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("userId", "firstName lastName email")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
