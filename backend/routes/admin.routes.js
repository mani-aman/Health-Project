const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
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

// Legacy admin routes — accessible by protected_admin, super_admin, and legacy 'admin'
const adminOnly = [authenticate, authorizeRoles("protected_admin", "super_admin", "admin")];

// Block public admin signup
router.post("/signup", (_req, res) => {
  return res.status(403).json({
    success: false,
    message: "Admin signup is disabled. Use the bootstrap process.",
  });
});

// Dashboard
router.get("/stats", adminOnly, dashboardStats);

// Doctors CRUD
router.get("/doctors", adminOnly, getDoctors);
router.post("/doctors", adminOnly, createDoctor);
router.put("/doctors/:id", adminOnly, updateDoctor);
router.delete("/doctors/:id", adminOnly, deleteDoctor);

// Appointments
router.get("/appointments", adminOnly, getAllAppointments);
router.put("/appointments/:id/status", adminOnly, updateAppointmentStatus);

// Users
router.get("/users", adminOnly, getUsers);
router.put("/users/:id", adminOnly, updateUser);

// Seed (dev only)
router.post("/seed/doctors", adminOnly, seedDoctors);

module.exports = router;
