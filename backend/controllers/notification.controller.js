const Notification = require("../models/Notification");

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate("doctorId", "firstName lastName specialization")
      .populate("appointmentId", "date time status")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
      metadata: { total: notifications.length, unread: unreadCount },
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching notifications" });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ msg: "Error updating notification" });
  }
};

// Mark all as read
exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true },
    );
    res.json({
      msg: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ msg: "Error updating notifications" });
  }
};
