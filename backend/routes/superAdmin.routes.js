const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");

// Super admin can only be created by protected_admin
// Super admin has doctor management + read medical records + view appointments
const superAdminOnly = [authenticate, authorizeRoles("super_admin")];

const {
  dashboardStats,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllMedicalRecords,
  getAllAppointments,
  getUsers,
} = require("../controllers/superAdmin.controller");

// Dashboard
router.get("/stats", superAdminOnly, dashboardStats);

// Doctor management
router.get("/doctors", superAdminOnly, getDoctors);
router.post("/doctors", superAdminOnly, createDoctor);
router.put("/doctors/:id", superAdminOnly, updateDoctor);
router.delete("/doctors/:id", superAdminOnly, deleteDoctor);

// Medical records — read-only, every access is logged
router.get("/medical-records", superAdminOnly, getAllMedicalRecords);

// Appointments
router.get("/appointments", superAdminOnly, getAllAppointments);

// Users — read-only
router.get("/users", superAdminOnly, getUsers);

module.exports = router;
