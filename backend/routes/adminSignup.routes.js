const express = require("express");
const router = express.Router();

const { adminSignup } = require("../controllers/adminSignup.controller");

// Kept for backward compatibility.
// This endpoint is NOT public in the current security model.
// Hard block; only keep this route mounted for legacy compatibility.
// This prevents any public signup attempts.
router.post("/signup", (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Admin signup is disabled. Admin accounts can only be created manually by developers.",
  });
});

module.exports = router;
