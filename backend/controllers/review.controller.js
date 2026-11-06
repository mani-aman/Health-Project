const Review = require("../models/Review");
const Appointment = require("../models/Appointment"); // ← was missing, caused ReferenceError
const Notification = require("../models/Notification");

// Create review/rating for doctor
exports.createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({ msg: "appointmentId and rating are required" });
    }

    // Verify appointment belongs to user and is completed
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: req.user._id,
      status: "completed",
    }).populate("doctorId");

    if (!appointment) {
      return res
        .status(400)
        .json({ msg: "Valid completed appointment required to leave a review" });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({
      userId: req.user._id,
      appointmentId,
    });
    if (existingReview) {
      return res.status(409).json({ msg: "You have already reviewed this appointment" });
    }

    const review = new Review({
      userId: req.user._id,
      doctorId: appointment.doctorId._id,
      appointmentId,
      rating,
      comment,
    });

    await review.save();

    // Notify doctor
    await Notification.create({
      userId: appointment.doctorId._id,
      type: "review",
      title: "New Patient Review",
      message: `You received a ${rating}/5 rating${comment ? `: "${comment.substring(0, 80)}"` : ""}`,
      data: { reviewId: review._id },
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get reviews for a doctor (public)
exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId })
      .populate("userId", "firstName lastName")
      .populate("appointmentId", "date")
      .sort({ createdAt: -1 })
      .limit(20);

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.json({ reviews, avgRating: parseFloat(avgRating), count: reviews.length });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching reviews" });
  }
};

// Get my reviews
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate("doctorId", "firstName lastName specialization")
      .populate("appointmentId", "date status")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching reviews" });
  }
};
