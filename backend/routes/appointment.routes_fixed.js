const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");

const appointmentController = require("../controllers/appointment.controller");
const { bookAppointment, getMyAppointments, cancelAppointment } =
  appointmentController;

router.post("/book", auth, bookAppointment);
router.get("/my", auth, getMyAppointments);
router.put("/cancel/:id", auth, cancelAppointment);

module.exports = router;
