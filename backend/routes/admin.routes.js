// const express = require("express");
// const router = express.Router();
// const { adminAuth } = require("../middleware/auth.middleware");
// const {
//   dashboardStats,
//   getDoctors,
//   createDoctor,
//   updateDoctor,
//   deleteDoctor,
//   getAllAppointments,
//   updateAppointmentStatus,
//   getUsers,
//   updateUser,
//   seedDoctors,
// } = require("../controllers/admin.controller");

// // Dashboard
// router.get("/stats", adminAuth, dashboardStats);

// // Doctors CRUD
// router.get("/doctors", adminAuth, getDoctors);
// router.post("/doctors", adminAuth, createDoctor);
// router.put("/doctors/:id", adminAuth, updateDoctor);
// router.delete("/doctors/:id", adminAuth, deleteDoctor);

// // Appointments
// router.get("/appointments", adminAuth, getAllAppointments);
// router.put("/appointments/:id/status", adminAuth, updateAppointmentStatus);

// // Users
// router.get("/users", adminAuth, getUsers);
// router.put("/users/:id", adminAuth, updateUser);

// // Seed
// router.post("/seed/doctors", adminAuth, seedDoctors);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth.middleware");
const {
  dashboardStats,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllAppointments,
  updateAppointmentStatus,
  getUsers,
  updateUser,
  seedDoctors,
} = require("../controllers/admin.controller");

// ✅ Admin signup: removed from public surface.
// Admin accounts must be created manually by developers or via a protected backend-only process.
// Keeping the controller exists for dev, but this route will now be blocked.
router.post("/signup", (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Admin signup is disabled. Admin accounts can only be created manually by developers.",
  });
});

// Dashboard
router.get("/stats", adminAuth, dashboardStats);

// Doctors CRUD
router.get("/doctors", adminAuth, getDoctors);
router.post("/doctors", adminAuth, createDoctor);
router.put("/doctors/:id", adminAuth, updateDoctor);
router.delete("/doctors/:id", adminAuth, deleteDoctor);

// Appointments
router.get("/appointments", adminAuth, getAllAppointments);
router.put("/appointments/:id/status", adminAuth, updateAppointmentStatus);

// Users
router.get("/users", adminAuth, getUsers);
router.put("/users/:id", adminAuth, updateUser);

// Seed
router.post("/seed/doctors", adminAuth, seedDoctors);

module.exports = router;
