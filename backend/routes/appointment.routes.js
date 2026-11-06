const router = require("express").Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");

const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
} = require("../controllers/appointment.controller");

// auth = any authenticated user
const auth = authenticate;
// doctorAuth = authenticated + doctor role
const doctorOnly = [authenticate, authorizeRoles("doctor")];

router.post("/book", auth, bookAppointment);
router.get("/my", auth, getMyAppointments);
router.get("/doctor", doctorOnly, getDoctorAppointments);
router.put("/cancel/:id", auth, cancelAppointment);
router.put("/confirm/:id", doctorOnly, confirmAppointment);
router.put("/reject/:id", doctorOnly, rejectAppointment);
router.put("/complete/:id", doctorOnly, completeAppointment);

module.exports = router;
