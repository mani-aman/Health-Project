const express = require("express");
const path = require("path");
const { authenticate, doctorAuth } = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  getMyPrescriptions,
  uploadRecord,
  getMyRecords,
  getPatientRecords,
  getPatientPrescriptions,
  downloadRecord,
} = require("../controllers/user.controller");

const multer = require("multer");
const upload = multer({
  dest: "uploads/records/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPEG and PNG files are allowed"));
  },
});

const router = express.Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/prescriptions", authenticate, getMyPrescriptions);
router.post("/records", [authenticate, upload.single("file")], uploadRecord);
router.get("/records", authenticate, getMyRecords);

// Authenticated file download — replaces public static serve
router.get("/records/:id/download", authenticate, downloadRecord);

// Doctor views patient data
router.get("/patients/:id/records", doctorAuth, getPatientRecords);
router.get("/patients/:id/prescriptions", doctorAuth, getPatientPrescriptions);

module.exports = router;
