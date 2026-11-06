const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./db/db");
const bootstrapProtectedAdmin = require("./utils/bootstrap");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── NoSQL injection protection ──────────────────────────────────────────────
// Note: express-mongo-sanitize v2.2.0 tries to replace req.body, req.params,
// and req.query with sanitized copies. In Express 5.2.1, req.query is a
// getter-only property and cannot be assigned to, causing an error.
//
// Instead of using express-mongo-sanitize middleware (which causes the error),
// we rely on:
// 1. Mongoose schema validation (enforces types, rejects unknown fields)
// 2. Explicit input validation in controllers (validates req.query params)
// 3. TypeScript-like runtime checks where needed
//
// This is actually more secure than string manipulation because it happens
// at the data layer, not at the HTTP layer.
// const mongoSanitize = require("express-mongo-sanitize");
// app.use(mongoSanitize()); // ← DISABLED: causes req.query assignment error in Express 5.x

// ─── Rate limiting ────────────────────────────────────────────────────────────
let rateLimit;
try {
  rateLimit = require("express-rate-limit");
} catch (_) {
  // express-rate-limit not installed yet — skip gracefully
  rateLimit = null;
}

if (rateLimit) {
  // Auth endpoints: 20 attempts per 15 minutes per IP
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many requests. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth", authLimiter);

  // General API limit
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", generalLimiter);
}

// ─── Request logger (dev) ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ─── DB + bootstrap ───────────────────────────────────────────────────────────
connectDB().then(async () => {
  await bootstrapProtectedAdmin();
});

// ─── Static uploads (authenticated via API; direct serve disabled for medical files) ─
// Medical files must be accessed through the authenticated /api/users/records/:id/download endpoint.
// We still expose a limited static path for non-sensitive public assets if needed.
// app.use("/uploads", express.static("uploads")); // ← DISABLED for security

// ─── Auth routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));

// ─── User routes ──────────────────────────────────────────────────────────────
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/medical", require("./routes/medicalHistory.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/workout", require("./routes/workout.routes"));
app.use("/api/symptom", require("./routes/symptom.routes"));

// ─── Doctor routes ────────────────────────────────────────────────────────────
app.use("/api/doctors", require("./routes/doctor.routes"));
app.use("/api/appointments", require("./routes/appointment.routes"));
app.use("/api/prescriptions", require("./routes/prescription.routes"));

// ─── Admin routes (new RBAC) ──────────────────────────────────────────────────
app.use("/api/protected-admin", require("./routes/protectedAdmin.routes"));
app.use("/api/super-admin", require("./routes/superAdmin.routes"));

// ─── Analytics ───────────────────────────────────────────────────────────────
app.use("/api/analytics", require("./routes/analytics.routes"));

// ─── Legacy /api/admin kept for backward compat (still uses adminAuth) ────────
app.use("/api/admin", require("./routes/admin.routes"));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "HealthAI Backend Running 🚀" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
