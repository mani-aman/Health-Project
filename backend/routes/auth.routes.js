const express = require("express");
const router = express.Router();
const { signup, login, doctorSignup } = require("../controllers/auth.controller");

// POST /api/auth/signup  — Normal User registration only
router.post("/signup", signup);

// POST /api/auth/login   — All roles, single endpoint
router.post("/login", login);

// POST /api/auth/doctor-signup — Blocked (returns 403)
// Kept so legacy frontend calls get a clear error instead of 404
router.post("/doctor-signup", doctorSignup);

module.exports = router;
