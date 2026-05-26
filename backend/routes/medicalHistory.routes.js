const express = require("express");
const {
  saveMedicalHistory,
} = require("../controllers/medicalHistory.controller");

const router = express.Router();

// ✅ API route
router.post("/medical", saveMedicalHistory);

module.exports = router;
