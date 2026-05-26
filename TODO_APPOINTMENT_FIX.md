# TODO - Fix Doctor Appointment

- [x] Fix `backend/controllers/appointment.controller.js`
  - [x] `bookAppointment`: `userId: req.user` → `userId: req.user.id`
  - [x] `getMyAppointments`: `userId: req.user` → `userId: req.user.id`
- [x] Fix `frontend/src/pages/Doctors.jsx`
  - [x] API response: `res.data` → `res.data.doctors`
  - [x] Doctor name: `doctor.firstName doctor.lastName` → `doctor.name`
