const MedicalHistory = require("../models/MedicalHistory.model");

// 💾 Save Medical History
const saveMedicalHistory = async (req, res) => {
  try {
    const { userId, bloodGroup, allergies, chronicDiseases, medications } =
      req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const history = new MedicalHistory({
      userId,
      bloodGroup,
      allergies,
      chronicDiseases,
      medications,
    });

    await history.save();

    return res.status(201).json({
      success: true,
      message: "Medical history saved successfully",
      data: history,
    });
  } catch (error) {
    console.error("Medical Save Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error saving medical history",
      error: error.message,
    });
  }
};

module.exports = { saveMedicalHistory };
