// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");

// const connectDB = require("./db/db");

// dotenv.config();

// const app = express();

// // middleware
// app.use(express.json());
// app.use(cors());

// // Debug: log every incoming request
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });

// // DB
// // 🔹 MongoDB Connection
// // NOTE: connectDB() already handles default URI + errors.
// connectDB();

// // routes
// const authRouter = require("./routes/auth.routes");
// app.use("/api/auth", authRouter);

// // Serve uploaded files (medical records)
// app.use("/uploads", express.static("uploads"));

// console.log(
//   "🔐 Auth routes mounted:",
//   authRouter.stack
//     .map(
//       (r) =>
//         r.route &&
//         `${Object.keys(r.route.methods).join(",").toUpperCase()} ${r.route.path}`,
//     )
//     .filter(Boolean),
// );

// app.use("/api/users", require("./routes/user.routes"));
// app.use("/api/notifications", require("./routes/notification.routes"));
// app.use("/api/reviews", require("./routes/review.routes"));
// app.use("/api/medical", require("./routes/medicalHistory.routes"));
// app.use("/api/chat", require("./routes/chat.routes"));
// app.use("/api/workout", require("./routes/workout.routes"));
// app.use("/api/symptom", require("./routes/symptom.routes"));
// app.use("/api/doctors", require("./routes/doctor.routes"));
// app.use("/api/appointments", require("./routes/appointment.routes"));
// app.use("/api/prescriptions", require("./routes/prescription.routes"));
// app.use("/api/admin", require("./routes/admin.routes"));
// app.use("/api/analytics", require("./routes/analytics.routes")); // Future

// // Admin signup (dev)
// app.use("/api/admin", require("./routes/adminSignup.routes"));

// app.get("/", (req, res) => {
//   res.send("AI Health Backend Running 🚀");
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./db/db");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Debug: log every incoming request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
connectDB();

// Auth routes
const authRouter = require("./routes/auth.routes");
app.use("/api/auth", authRouter);

// Serve uploaded files (medical records)
app.use("/uploads", express.static("uploads"));

console.log(
  "🔐 Auth routes mounted:",
  authRouter.stack
    .map(
      (r) =>
        r.route &&
        `${Object.keys(r.route.methods).join(",").toUpperCase()} ${r.route.path}`,
    )
    .filter(Boolean),
);

// All routes
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/medical", require("./routes/medicalHistory.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/workout", require("./routes/workout.routes"));
app.use("/api/symptom", require("./routes/symptom.routes"));
app.use("/api/doctors", require("./routes/doctor.routes"));
app.use("/api/appointments", require("./routes/appointment.routes"));
app.use("/api/prescriptions", require("./routes/prescription.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

// ✅ Single /api/admin mount — signup is now inside admin.routes.js
app.use("/api/admin", require("./routes/admin.routes"));

// ❌ REMOVED: app.use("/api/admin", require("./routes/adminSignup.routes"));

app.get("/", (req, res) => {
  res.send("AI Health Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
