// const express = require("express");
// const router = express.Router();
// const {
//   createPrescription,
//   getMyPrescriptions,
//   getPrescriptionsForPatient,
// } = require("../controllers/prescription.controller");
// const { auth, doctorAuth } = require("../middleware/auth.middleware");

// router.post("/create", doctorAuth, createPrescription);
// // Patient should be able to view their own prescriptions
// router.get("/my", auth, getMyPrescriptions);
// // Doctor should view their own prescriptions via a separate route
// router.get("/doctor/my", doctorAuth, getMyPrescriptions);
// router.get("/patient/:id", doctorAuth, getPrescriptionsForPatient);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionsForPatient,
  getPatientPrescriptions,
} = require("../controllers/prescription.controller");
const { auth, doctorAuth } = require("../middleware/auth.middleware");

// Doctor routes
router.post("/create", doctorAuth, createPrescription);
// NOTE: patients should access via auth token
router.get("/my", auth, getMyPrescriptions);

router.get("/doctor/my", doctorAuth, getMyPrescriptions);
router.get("/patient/:id", doctorAuth, getPrescriptionsForPatient);

// Patient route — GET /api/prescriptions/mine
router.get("/mine", auth, getPatientPrescriptions);

module.exports = router;
