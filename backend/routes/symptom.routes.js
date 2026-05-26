const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const { symptomCheck } = require("../controllers/sympton.controller");

const router = express.Router();

router.post("/check", auth, symptomCheck);

module.exports = router;
