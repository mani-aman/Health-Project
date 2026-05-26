const router = require("express").Router();
const { auth, doctorAuth } = require("../middleware/auth.middleware");

const appointmentController = require("../controllers/appointment.controller");
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
} = appointmentController;

router.post("/book", auth, bookAppointment);
router.get("/my", auth, getMyAppointments);
router.get("/doctor", doctorAuth, getDoctorAppointments);
router.put("/cancel/:id", auth, cancelAppointment);
router.put("/confirm/:id", doctorAuth, confirmAppointment);
router.put("/reject/:id", doctorAuth, rejectAppointment);
router.put("/complete/:id", doctorAuth, completeAppointment);

module.exports = router;
