const SystemNotification = require("../models/SystemNotification");
const Notification = require("../models/Notification");
const User = require("../models/auth.model");

// Create system notification (admin broadcast)
exports.createSystemNotification = async (req, res) => {
  try {
    const notification = new SystemNotification({
      ...req.body,
      createdBy: req.user.id,
    });

    await notification.save();

    // Auto-create user notifications for target roles
    const targetUsersQuery = { role: { $in: req.body.targetRoles } };
    const targetUsers = await User.find(targetUsersQuery, "_id");

    const userNotifications = targetUsers.map((user) => ({
      userId: user._id,
      type: "system",
      title: notification.title,
      message: notification.message,
      data: { systemNotifId: notification._id },
    }));

    await Notification.insertMany(userNotifications);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all system notifications (admin view)
exports.getSystemNotifications = async (req, res) => {
  try {
    const notifications = await SystemNotification.find()
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching notifications" });
  }
};

// Update system notification
exports.updateSystemNotification = async (req, res) => {
  try {
    const notification = await SystemNotification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    ).populate("createdBy");

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Delete system notification
exports.deleteSystemNotification = async (req, res) => {
  try {
    const notification = await SystemNotification.findByIdAndDelete(
      req.params.id,
    );
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ msg: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
