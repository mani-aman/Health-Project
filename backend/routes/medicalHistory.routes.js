const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { saveMedicalHistory, getMedicalHistory } = require("../controllers/medicalHistory.controller");

const router = express.Router();

// POST /api/medical  — Save/update medical history (authenticated users only)
router.post("/", authenticate, saveMedicalHistory);

// GET /api/medical   — Get own medical history
router.get("/", authenticate, getMedicalHistory);

module.exports = router;
