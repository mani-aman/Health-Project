const Review = require("../models/Review");
const Notification = require("../models/Notification");

// Create review/rating for doctor
exports.createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    // Verify appointment belongs to user
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: req.user.id,
      status: { $in: ["completed"] },
    }).populate("doctorId");

    if (!appointment) {
      return res
        .status(400)
        .json({ msg: "Valid completed appointment required" });
    }

    const review = new Review({
      userId: req.user.id,
      doctorId: appointment.doctorId._id,
      appointmentId,
      rating,
      comment,
    });

    await review.save();

    // Send notification to doctor
    await Notification.create({
      userId: appointment.doctorId._id,
      type: "review",
      title: `New Review from ${req.user.firstName}`,
      message: `You received a ${rating}/5 rating${comment ? ` with comment: "${comment.substring(0, 100)}..."` : ""}`,
      data: { reviewId: review._id },
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get reviews for specific doctor
exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId })
      .populate("userId", "firstName lastName")
      .populate("appointmentId", "date")
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : 0;

    res.json({
      reviews,
      avgRating: parseFloat(avgRating),
      count: reviews.length,
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching reviews" });
  }
};

// Get all user reviews
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate("doctorId", "firstName lastName specialization")
      .populate("appointmentId", "date status")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching reviews" });
  }
};
