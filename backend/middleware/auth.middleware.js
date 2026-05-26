const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
};

// Admin only middleware
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
};

// Doctor only middleware
const doctorAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access required" });
    }
    next();
  });
};

module.exports = { auth, adminAuth, doctorAuth };
