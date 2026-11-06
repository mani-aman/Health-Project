const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionsForPatient,
  getPatientPrescriptions,
} = require("../controllers/prescription.controller");

const auth = authenticate;
const doctorOnly = [authenticate, authorizeRoles("doctor")];

// Doctor routes
router.post("/create", doctorOnly, createPrescription);
router.get("/doctor/my", doctorOnly, getMyPrescriptions);
router.get("/patient/:id", doctorOnly, getPrescriptionsForPatient);

// Patient routes
router.get("/my", auth, getMyPrescriptions);
router.get("/mine", auth, getPatientPrescriptions);

module.exports = router;
