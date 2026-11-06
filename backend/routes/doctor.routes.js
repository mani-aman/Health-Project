const router = require("express").Router();
const { authenticate, authorizeRoles, doctorAuth } = require("../middleware/auth.middleware");
const {
  getDoctors,
  addDoctor,
  getMyPatients,
  getPatientDetails,
  uploadPatientRecord,
} = require("../controllers/doctor.controller");

const multer = require("multer");
const path = require("path");
const upload = multer({
  dest: "uploads/records/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPEG and PNG files are allowed"));
  },
});

// Public — get active doctors
router.get("/", getDoctors);

// Admin-only — legacy add (now protected)
router.post(
  "/add",
  [authenticate, authorizeRoles("protected_admin", "super_admin", "admin")],
  addDoctor,
);

// Doctor-only routes
router.get("/mypatients", doctorAuth, getMyPatients);
router.get("/patients/:id", doctorAuth, getPatientDetails);
router.post("/records", [...doctorAuth, upload.single("file")], uploadPatientRecord);

module.exports = router;
