const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const {
  getNotifications,
  markAsRead,
  markAllRead,
} = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", auth, getNotifications);
router.patch("/:id/read", auth, markAsRead);
router.patch("/read-all", auth, markAllRead);

module.exports = router;
