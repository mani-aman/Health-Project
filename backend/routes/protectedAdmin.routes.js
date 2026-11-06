const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");

const paOnly = [authenticate, authorizeRoles("protected_admin", "admin")];

const {
  dashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  setUserStatus,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSuperAdmins,
  createSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
  getAllMedicalRecords,
  getAuditLogs,
  getAllAppointments,
} = require("../controllers/protectedAdmin.controller");

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get("/stats", paOnly, dashboardStats);

// ─── User Management ─────────────────────────────────────────────────────────
router.get("/users", paOnly, getAllUsers);
router.get("/users/:id", paOnly, getUserById);
router.put("/users/:id", paOnly, updateUser);
router.patch("/users/:id/status", paOnly, setUserStatus);
router.delete("/users/:id", paOnly, deleteUser);

// ─── Doctor Management ───────────────────────────────────────────────────────
router.get("/doctors", paOnly, getDoctors);
router.post("/doctors", paOnly, createDoctor);
router.put("/doctors/:id", paOnly, updateDoctor);
router.delete("/doctors/:id", paOnly, deleteDoctor);

// ─── Super Admin Management ──────────────────────────────────────────────────
router.get("/super-admins", paOnly, getSuperAdmins);
router.post("/super-admins", paOnly, createSuperAdmin);
router.put("/super-admins/:id", paOnly, updateSuperAdmin);
router.delete("/super-admins/:id", paOnly, deleteSuperAdmin);

// ─── Medical Records (read + logged) ─────────────────────────────────────────
router.get("/medical-records", paOnly, getAllMedicalRecords);

// ─── Appointments ─────────────────────────────────────────────────────────────
router.get("/appointments", paOnly, getAllAppointments);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", paOnly, getAuditLogs);

module.exports = router;
