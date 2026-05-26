const express = require("express");
const { auth, doctorAuth } = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  getMyPrescriptions,
  uploadRecord,
  getMyRecords,
  getPatientRecords,
  getPatientPrescriptions,
} = require("../controllers/user.controller");
const multer = require("multer");
const upload = multer({ dest: "uploads/records/" });

const router = express.Router();

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.get("/prescriptions", auth, getMyPrescriptions);
router.post("/records", [auth, upload.single("file")], uploadRecord);
router.get("/records", auth, getMyRecords);
router.get("/patients/:id/records", doctorAuth, getPatientRecords);
router.get("/patients/:id/prescriptions", doctorAuth, getPatientPrescriptions);

module.exports = router;
