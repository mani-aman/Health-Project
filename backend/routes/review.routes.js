const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const {
  createReview,
  getMyReviews,
  getDoctorReviews,
} = require("../controllers/review.controller");

const router = express.Router();

router.post("/", auth, createReview);
router.get("/my", auth, getMyReviews);
router.get("/doctor/:doctorId", getDoctorReviews); // Public for doctor profiles

module.exports = router;
