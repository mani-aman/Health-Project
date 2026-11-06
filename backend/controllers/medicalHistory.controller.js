const MedicalHistory = require("../models/MedicalHistory.model");

// POST /api/medical — Save / upsert medical history for authenticated user
const saveMedicalHistory = async (req, res) => {
  try {
    const { bloodGroup, allergies, chronicDiseases, medications } = req.body;

    // Always use the authenticated user's ID — never trust req.body.userId
    const userId = req.user._id;

    // Upsert so re-submitting the form updates instead of creating duplicates
    const history = await MedicalHistory.findOneAndUpdate(
      { userId },
      { bloodGroup, allergies, chronicDiseases, medications },
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Medical history saved",
      data: history,
    });
  } catch (err) {
    console.error("Medical history save error:", err.message);
    return res.status(500).json({ success: false, message: "Error saving medical history" });
  }
};

// GET /api/medical — Retrieve own medical history
const getMedicalHistory = async (req, res) => {
  try {
    const history = await MedicalHistory.findOne({ userId: req.user._id });
    return res.json(history || {});
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching medical history" });
  }
};

module.exports = { saveMedicalHistory, getMedicalHistory };
