const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  appointmentAnalytics,
  patientGrowth,
  reviewAnalytics,
} = require("../controllers/analytics.controller");

const adminOnly = [authenticate, authorizeRoles("protected_admin", "super_admin", "admin")];

router.get("/appointments", adminOnly, appointmentAnalytics);
router.get("/patients", adminOnly, patientGrowth);
router.get("/reviews", adminOnly, reviewAnalytics);

module.exports = router;
