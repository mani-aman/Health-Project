const Doctor = require("../models/Doctor");
const User = require("../models/auth.model");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const MedicalHistory = require("../models/MedicalHistory.model");
const Prescription = require("../models/Prescription");

// Get doctors with search/filter
exports.getDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      available,
      limit = 12,
      page = 1,
    } = req.query;

    const query = { status: "active" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (specialization) {
      query.specialization = specialization;
    }

    const doctors = await Doctor.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(
      "📋 GET /doctors query:",
      query,
      "Found",
      doctors.length,
      "active doctors",
    );

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching doctors" });
  }
};

// Get unique patients for the logged-in doctor
exports.getMyPatients = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    const doctorId = doctor ? doctor._id : req.user.id;

    // Find all appointments where this doctor was involved
    const appointments = await Appointment.find({ doctorId })
      .populate("userId", "firstName lastName email mobile healthProfile")
      .sort({ createdAt: -1 });

    // Extract unique patients
    const patientMap = new Map();
    appointments.forEach((apt) => {
      if (apt.userId) {
        const id = apt.userId._id.toString();
        if (!patientMap.has(id)) {
          patientMap.set(id, {
            _id: apt.userId._id,
            firstName: apt.userId.firstName,
            lastName: apt.userId.lastName,
            email: apt.userId.email,
            mobile: apt.userId.mobile,
            healthProfile: apt.userId.healthProfile,
            totalAppointments: 1,
            lastVisit: apt.date,
          });
        } else {
          const p = patientMap.get(id);
          p.totalAppointments += 1;
          if (new Date(apt.date) > new Date(p.lastVisit)) {
            p.lastVisit = apt.date;
          }
        }
      }
    });

    const patients = Array.from(patientMap.values());
    res.json(patients);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error fetching patients", error: err.message });
  }
};

// Get full patient details for doctor view
exports.getPatientDetails = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Get patient basic info
    const patient = await User.findById(patientId).select("-password");
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Get medical history
    const medicalHistory = await MedicalHistory.findOne({ userId: patientId });

    // Get appointments with this doctor
    const doctor = await Doctor.findOne({ userId: req.user.id });
    const doctorId = doctor ? doctor._id : req.user.id;

    const appointments = await Appointment.find({
      userId: patientId,
      doctorId,
    }).sort({ createdAt: -1 });

    // Get prescriptions
    const appointmentIds = appointments.map((a) => a._id);
    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
    })
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 });

    // Get medical records
    const records = await MedicalRecord.find({ userId: patientId }).sort({
      createdAt: -1,
    });

    res.json({
      patient,
      medicalHistory,
      appointments,
      prescriptions,
      records,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error fetching patient details", error: err.message });
  }
};

// Doctor uploads medical record for a patient
exports.uploadPatientRecord = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const { patientId, appointmentId, type, description } = req.body;

    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID is required" });
    }

    const record = new MedicalRecord({
      userId: patientId,
      appointmentId: appointmentId || null,
      filename: req.file.originalname,
      path: req.file.path,
      contentType: req.file.mimetype,
      size: req.file.size,
      type: type || "report",
      description: description || "",
      uploadedBy: req.user.id,
    });

    await record.save();
    res.json({ success: true, msg: "Record uploaded successfully", record });
  } catch (err) {
    res.status(500).json({ msg: "Upload failed", error: err.message });
  }
};

// Add doctor (admin use - legacy)
exports.addDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
