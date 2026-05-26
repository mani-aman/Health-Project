const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  doctorSignup,
} = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/doctor-signup", doctorSignup);
router.post("/login", login);

module.exports = router;
