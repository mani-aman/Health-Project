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
