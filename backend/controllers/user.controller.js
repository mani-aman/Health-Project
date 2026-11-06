const path = require("path");
const User = require("../models/auth.model");
const Prescription = require("../models/Prescription");
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");
const AuditLog = require("../models/AuditLog");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Calculate BMI if height/weight present
    if (user.healthProfile?.height && user.healthProfile?.weight) {
      const heightM = user.healthProfile.height / 100;
      user.healthProfile.bmi = parseFloat(
        (user.healthProfile.weight / (heightM * heightM)).toFixed(2),
      );
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Update profile (health data)
exports.updateProfile = async (req, res) => {
  try {
    const updates = { healthProfile: req.body.healthProfile || {} };
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Recalculate BMI
    if (user.healthProfile?.height && user.healthProfile?.weight) {
      const heightM = user.healthProfile.height / 100;
      user.healthProfile.bmi = parseFloat(
        (user.healthProfile.weight / (heightM * heightM)).toFixed(2),
      );
      await user.save();
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get user's prescriptions
exports.getMyPrescriptions = async (req, res) => {
  try {
    // First get user's appointments
    const appointments = await Appointment.find({ userId: req.user.id }).select(
      "_id",
    );
    const appointmentIds = appointments.map((a) => a._id);

    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
    })
      .populate("appointmentId", "date time status doctorId userId")
      .populate("doctorId", "firstName lastName specialization")
      .sort({ createdAt: -1 });

    // DEBUG (remove later)
    // console.log('getMyPrescriptions userId=', req.user.id, 'appointmentIds=', appointmentIds, 'count=', prescriptions.length);

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching prescriptions" });
  }
};

// Upload medical record
exports.uploadRecord = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const record = new MedicalRecord({
      userId: req.user.id,
      filename: req.file.originalname,
      path: req.file.path,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      ...req.body,
    });

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: "Upload failed" });
  }
};

// Get user medical records
exports.getMyRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ userId: req.user.id })
      .populate("appointmentId")
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching records" });
  }
};

// Get patient records (doctor view)
exports.getPatientRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ userId: req.params.id })
      .populate("appointmentId")
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching patient records" });
  }
};

// Get patient prescriptions (doctor view)
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      userId: req.params.id,
    }).select("_id");
    const appointmentIds = appointments.map((a) => a._id);

    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
    })
      .populate("appointmentId", "date time status")
      .populate("doctorId", "firstName lastName specialization")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching patient prescriptions" });
  }
};

// Authenticated file download — replaces public static serve
exports.downloadRecord = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    // Admins can download any record; users can only download their own
    const query = ["protected_admin", "super_admin", "admin", "doctor"].includes(userRole)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

    const record = await MedicalRecord.findOne(query);
    if (!record) {
      return res.status(404).json({ msg: "Record not found or access denied" });
    }

    // Log admin access to patient files
    if (["protected_admin", "super_admin", "admin"].includes(userRole)) {
      await AuditLog.create({
        actorId: userId,
        actorRole: userRole,
        action: "medical_record_view",
        targetId: record._id,
        targetType: "MedicalRecord",
        details: { filename: record.filename, patientId: record.userId },
        ipAddress: req.ip,
      });
    }

    res.sendFile(path.resolve(record.path));
  } catch (err) {
    res.status(500).json({ msg: "Download failed" });
  }
};
