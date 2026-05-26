const express = require("express");
const router = express.Router();
const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionsForPatient,
} = require("../controllers/prescription.controller");
const { doctorAuth } = require("../middleware/auth.middleware");

router.post("/create", doctorAuth, createPrescription);
router.get("/my", doctorAuth, getMyPrescriptions);
router.get("/patient/:id", doctorAuth, getPrescriptionsForPatient);

module.exports = router;
