const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const { generateWorkout } = require("../controllers/workout.controller");

const router = express.Router();

router.post("/workout", auth, generateWorkout);

module.exports = router;
