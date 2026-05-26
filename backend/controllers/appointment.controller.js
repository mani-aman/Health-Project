const Appointment = require("../models/Appointment");
const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");

// Book appointment
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    const appointment = await Appointment.create({
      userId: req.user.id,
      doctorId,
      date,
      time,
    });

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

// Get user appointments
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      userId: req.user.id,
    }).populate("doctorId");

    // Normalize field names for frontend (date/time)
    const normalized = appointments.map((a) => ({
      ...a.toObject(),
      date: a.date ?? a.appointmentDate,
      time: a.time ?? a.appointmentTime,
    }));

    res.json(normalized);
  } catch {
    res.status(500).json({ msg: "Error fetching appointments" });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "cancelled" },
      { new: true },
    ).populate("doctorId");

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    res.json({ msg: "Appointment cancelled successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error cancelling appointment" });
  }
};

// Get doctor appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Strategy 1: Find Doctor record explicitly linked to this user
    let doctor = await Doctor.findOne({ userId: req.user.id });

    // Strategy 2: Try name match for legacy/unlinked records
    if (!doctor && user) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      doctor = await Doctor.findOne({
        $or: [
          { name: fullName },
          { name: { $regex: user.firstName || "", $options: "i" } },
        ],
      });
    }

    const doctorId = doctor ? doctor._id : req.user.id;

    const appointments = await Appointment.find({
      doctorId,
    }).populate("userId", "firstName lastName email mobile");

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching doctor appointments" });
  }
};

// Confirm appointment (doctor only)
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "confirmed", confirmedByDoctor: req.user.id },
      { new: true },
    )
      .populate("userId", "firstName lastName email mobile")
      .populate("doctorId", "name specialization");

    if (!appointment) {
      return res
        .status(404)
        .json({ msg: "Appointment not found or already processed" });
    }

    res.json({ msg: "Appointment confirmed successfully", appointment });
  } catch (err) {
    res.status(500).json({ msg: "Error confirming appointment" });
  }
};

// Reject appointment (doctor only)
const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "rejected", confirmedByDoctor: req.user.id },
      { new: true },
    )
      .populate("userId", "firstName lastName email mobile")
      .populate("doctorId", "name specialization");

    if (!appointment) {
      return res
        .status(404)
        .json({ msg: "Appointment not found or already processed" });
    }

    res.json({ msg: "Appointment rejected successfully", appointment });
  } catch (err) {
    res.status(500).json({ msg: "Error rejecting appointment" });
  }
};

// Complete appointment (doctor only)
const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, status: "confirmed" },
      { status: "completed", confirmedByDoctor: req.user.id },
      { new: true },
    )
      .populate("userId", "firstName lastName email mobile")
      .populate("doctorId", "name specialization");

    if (!appointment) {
      return res
        .status(404)
        .json({ msg: "Appointment not found or not confirmed" });
    }

    res.json({ msg: "Appointment completed successfully", appointment });
  } catch (err) {
    res.status(500).json({ msg: "Error completing appointment" });
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
};
