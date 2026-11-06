const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { normalizeRole } = require("../middleware/auth.middleware");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

const safeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  status: user.status,
});

const sendWelcomeEmail = async (email, firstName, subject) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: `"HealthAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `<h2>Hello ${firstName}!</h2><p>Your HealthAI account has been created successfully.</p><p>Thanks,<br>HealthAI Team</p>`,
    });
  } catch (err) {
    // Email failure must never break the signup flow
    console.error("Email send failed:", err.message);
  }
};

// ─── POST /api/auth/signup  (Normal User only) ───────────────────────────────

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "firstName, lastName, email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      mobile,
      password: hashedPassword,
      role: "user",   // ← always user. Never trust frontend role
      status: "active",
    });

    await sendWelcomeEmail(user.email, user.firstName, "Welcome to HealthAI!");

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── POST /api/auth/login  (All roles — single endpoint) ────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Generic message — do not reveal whether email exists
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.status === "blocked" || user.status === "inactive") {
      return res
        .status(403)
        .json({ success: false, message: "Account is disabled. Contact support." });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    // ⚠️ Never expose err.stack or err.message in production responses
    console.error("Login error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── POST /api/auth/doctor-signup  ──────────────────────────────────────────
// BLOCKED – Doctors cannot self-register. Only admins can create doctor accounts.

exports.doctorSignup = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Public doctor registration is disabled. Doctor accounts are created by administrators.",
  });
};
