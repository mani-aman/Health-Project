const router = require("express").Router();
const { doctorAuth } = require("../middleware/auth.middleware");
const {
  getDoctors,
  addDoctor,
  getMyPatients,
  getPatientDetails,
  uploadPatientRecord,
} = require("../controllers/doctor.controller");
const multer = require("multer");
const upload = multer({ dest: "uploads/records/" });

// Public routes
router.get("/", getDoctors);
router.post("/add", addDoctor);

// Doctor-only routes
router.get("/mypatients", doctorAuth, getMyPatients);
router.get("/patients/:id", doctorAuth, getPatientDetails);
router.post(
  "/records",
  [doctorAuth, upload.single("file")],
  uploadPatientRecord,
);

module.exports = router;
