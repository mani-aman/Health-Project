const AdminLog = require("../models/AdminLog");

// Log admin action
const logAdminAction = (action, targetId = null, details = {}) => {
  return async (req, res, next) => {
    try {
      const log = new AdminLog({
        adminId: req.user.id,
        action,
        targetId,
        details: { ...details, ip: req.ip, userAgent: req.get("User-Agent") },
        success: true,
      });
      await log.save();
    } catch (err) {
      console.error("Log error:", err);
    }
    next();
  };
};

module.exports = { logAdminAction };
