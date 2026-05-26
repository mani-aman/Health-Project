const Appointment = require("../models/Appointment");
const User = require("../models/auth.model");
const Review = require("../models/Review");

// Appointments analytics
exports.appointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const dailyAppointments = await Appointment.aggregate(pipeline);

    // Most booked doctors
    const topDoctors = await Appointment.aggregate([
      { $match: match },
      { $group: { _id: "$doctorId", count: { $sum: 1 } } },
      { $limit: 5 },
      { $sort: { count: -1 } },
    ]);

    res.json({ dailyAppointments, topDoctors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Patient growth
exports.patientGrowth = async (req, res) => {
  try {
    const growth = await User.aggregate([
      {
        $match: {
          role: "patient",
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(growth);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reviews analytics
exports.reviewAnalytics = async (req, res) => {
  try {
    const reviews = await Review.aggregate([
      {
        $group: {
          _id: "$doctorId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
    ]);

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
