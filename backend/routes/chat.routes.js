const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth.middleware");

const { chatWithAI } = require("../controllers/chat.controller");

// 🤖 Chat API route (protected)
router.post("/chat", auth, chatWithAI);

module.exports = router;
