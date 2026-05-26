const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth.middleware");
const {
  appointmentAnalytics,
  patientGrowth,
  reviewAnalytics,
} = require("../controllers/analytics.controller");

// Analytics routes
router.get("/appointments", adminAuth, appointmentAnalytics);
router.get("/patients", adminAuth, patientGrowth);
router.get("/reviews", adminAuth, reviewAnalytics);

module.exports = router;
