const User = require("../models/auth.model");
const Prescription = require("../models/Prescription");
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");

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
