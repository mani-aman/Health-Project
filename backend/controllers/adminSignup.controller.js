const User = require("../models/auth.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Admin Signup (single-admin enforcement)
// This endpoint must be admin-only in production.
// For dev, we still block multiple admins and block role escalation.
exports.adminSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // Enforce single-admin globally (single-admin system)
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message:
          "Admin already exists. Multiple admin accounts are not allowed.",
      });
    }

    // Also prevent duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      role: "admin",
    });

    // Block role escalation just in case (defense-in-depth)
    const forcedRole = "admin";
    const token = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: forcedRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      message: "Admin signup successful",
      token,
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName || "",
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (err) {
    console.error("Admin Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err?.message,
    });
  }
};
