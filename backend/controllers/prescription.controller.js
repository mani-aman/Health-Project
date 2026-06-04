const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");

// Create prescription for appointment
exports.createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, notes, instructions } = req.body;

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: req.user.id,
      medicines,
      notes,
      instructions,
    });

    // Link to appointment
    await Appointment.findByIdAndUpdate(appointmentId, {
      prescriptionId: prescription._id,
      status: "completed",
    });

    await prescription.populate("appointmentId", "userId date time");

    res.json(prescription);
  } catch (err) {
    res.status(500).json({ msg: "Error creating prescription" });
  }
};

// Get prescriptions for doctor
exports.getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id })
      .populate("appointmentId", "userId date time status")
      .populate("appointmentId.userId", "firstName lastName")
      .sort({ date: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching prescriptions" });
  }
};

// Get prescriptions for a specific patient (doctor view)
exports.getPrescriptionsForPatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    const appointments = await Appointment.find({ userId: patientId }).select(
      "_id",
    );
    const appointmentIds = appointments.map((a) => a._id);

    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
      doctorId: req.user.id,
    })
      .populate("appointmentId", "date time status")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching prescriptions for patient" });
  }
};

// Get prescriptions for logged-in patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ userId: patientId }).select(
      "_id",
    );
    const appointmentIds = appointments.map((a) => a._id);

    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
    })
      .populate("appointmentId", "date time status")
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching patient prescriptions" });
  }
};
