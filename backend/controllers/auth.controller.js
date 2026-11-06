const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { normalizeRole } = require("../middleware/auth.middleware");

// ─── Nodemailer singleton ─────────────────────────────────────────────────────
//
// Design decisions:
//
// 1. SINGLETON — createTransport() is called at most once per process.
//    Calling it per-request (the original bug) created a new TLSSocket on every
//    signup, accumulating 'end' listeners and triggering MaxListenersExceededWarning.
//
// 2. POOL (pool: true) — uses SMTPPool instead of SMTPTransport.
//    Without pool, each sendMail() still opens a fresh TLS connection and closes it
//    after delivery.  The pool keeps up to maxConnections persistent connections,
//    re-uses them across concurrent sends, and automatically removes/replaces a
//    connection that errors out (self-healing on transient failures).
//    maxConnections:2 is intentionally conservative for a welcome-email workload.
//
// 3. RACE-FREE INIT — the _creating flag prevents two concurrent calls from both
//    reaching createTransport() before _transporter is assigned.  Node's event loop
//    is single-threaded, so a simple boolean guard is sufficient and correct.
//
// 4. RESET PATH — resetTransporter() lets callers (and tests) clear the singleton
//    after a permanent failure (e.g. credentials rotated, AUTH rejected) so the next
//    call to getTransporter() will rebuild it with the current env vars.
//    It also calls pool.close() to drain in-flight messages gracefully.

let _transporter = null;
let _creating    = false;   // guard against re-entrant init on the same tick

const getTransporter = () => {
  // Fast path — already built.
  if (_transporter) return _transporter;

  // No credentials configured — email is intentionally disabled.
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  // Re-entrant guard: if a concurrent synchronous call already started building
  // the transporter, return null for this call rather than double-creating.
  if (_creating) return null;
  _creating = true;

  try {
    _transporter = nodemailer.createTransport({
      pool: true,           // SMTPPool — persistent connections, self-healing on error
      maxConnections: 2,    // conservative ceiling for a low-volume welcome-email path
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
  } finally {
    _creating = false;
  }

  return _transporter;
};

/**
 * Reset the singleton.  Call this after a permanent SMTP failure (e.g. AUTH error,
 * credentials rotation) so the next getTransporter() call rebuilds with fresh env vars.
 * Safe to call from tests to isolate test cases from one another.
 */
const resetTransporter = () => {
  if (_transporter) {
    try {
      // Drain queued messages and release pool connections gracefully.
      _transporter.close();
    } catch (_) {
      // close() is best-effort; ignore errors during teardown.
    }
    _transporter = null;
  }
};

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
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"HealthAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `<h2>Hello ${firstName}!</h2><p>Your HealthAI account has been created successfully.</p><p>Thanks,<br>HealthAI Team</p>`,
    });
  } catch (err) {
    // Email failure must never break the signup flow.
    console.error("Email send failed:", err.message);

    // Reset the singleton on permanent SMTP failures so the next call rebuilds
    // the transporter with fresh credentials.  Transient errors (e.g. ECONNRESET)
    // are handled internally by the pool and do not require a reset.
    const permanentCodes = new Set(["EAUTH", "EENVELOPE", "EDNS", "ESOCKET"]);
    if (err.code && permanentCodes.has(err.code)) {
      resetTransporter();
    }
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

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[LOGIN] Attempting login for email: ${normalizedEmail}`);

    // ─── Protected Admin authentication (from .env, NOT MongoDB) ─────────────────────
    const protectedAdminEmail = (process.env.PROTECTED_ADMIN_EMAIL || "").toLowerCase().trim();
    const protectedAdminPassword = process.env.PROTECTED_ADMIN_PASSWORD;

    if (protectedAdminEmail && protectedAdminPassword && normalizedEmail === protectedAdminEmail) {
      console.log(`[LOGIN] Protected Admin credential match detected for: ${normalizedEmail}`);

      // Verify password directly against .env (NOT bcrypt, since .env has plaintext)
      if (password === protectedAdminPassword) {
        console.log(`[LOGIN] Protected Admin password verified`);

        // Create a synthetic Protected Admin user object for JWT
        // This object will NOT be persisted to MongoDB
        const protectedAdminUser = {
          _id: "protected-admin-env",
          firstName: process.env.PROTECTED_ADMIN_FIRST_NAME || "Protected",
          lastName: process.env.PROTECTED_ADMIN_LAST_NAME || "Admin",
          email: protectedAdminEmail,
          role: "protected_admin",
          status: "active",
        };

        const token = signToken(protectedAdminUser);

        console.log(`[LOGIN] Login successful for Protected Admin (role: protected_admin)`);

        return res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          user: safeUser(protectedAdminUser),
        });
      } else {
        console.log(`[LOGIN] Protected Admin password mismatch`);
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    }

    // ─── All other roles (Patient, Doctor, Super Admin) — query MongoDB ──────────────
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`[LOGIN] User not found: ${normalizedEmail}`);
      // Generic message — do not reveal whether email exists
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    console.log(`[LOGIN] User found: ${user.email}, role: ${user.role}, status: ${user.status}`);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[LOGIN] Password mismatch for: ${normalizedEmail}`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    console.log(`[LOGIN] Password verified for: ${normalizedEmail}`);

    if (user.status === "blocked" || user.status === "inactive") {
      console.log(`[LOGIN] Account ${normalizedEmail} is ${user.status}`);
      return res
        .status(403)
        .json({ success: false, message: "Account is disabled. Contact support." });
    }

    const token = signToken(user);

    console.log(`[LOGIN] Login successful for: ${normalizedEmail} (role: ${user.role})`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    // ⚠️ Never expose err.stack or err.message in production responses
    console.error("[LOGIN] Login error:", err.message);
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

// ─── Exported for testing only ────────────────────────────────────────────────
// These are not part of the public HTTP API.
exports._getTransporter   = getTransporter;
exports._resetTransporter = resetTransporter;
exports._sendWelcomeEmail = sendWelcomeEmail;
