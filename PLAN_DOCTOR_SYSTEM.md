# Doctor Dashboard & Login System — Implementation Plan

## User Requirements

1. Doctors and staff should have their own login dashboard
2. Doctors can accept/reject patient appointments
3. Doctors can upload prescriptions and medical reports for patients
4. Doctors can update patient data
5. Each registered doctor gets their own ID and password

## Current System Analysis

### What Already Works

- **Auth System**: User model supports `role: 'doctor'`, same login endpoint works for all roles
- **Middleware**: `doctorAuth` middleware already exists to protect doctor-only routes
- **Appointments**: Endpoints exist for `getDoctorAppointments`, `confirmAppointment`, `rejectAppointment`
- **Prescriptions**: `createPrescription` endpoint exists with `doctorAuth`
- **Patient Data**: `getPatientRecords` and `getPatientPrescriptions` exist for doctor view

### What's Missing

- Admin `createDoctor` only creates a `Doctor` record, NOT a `User` account with login credentials
- No endpoint to get a doctor's unique patient list
- No endpoint for doctors to upload medical records for patients
- No endpoint to get full patient details (doctor view)
- `DoctorDashboard.jsx` is too basic — missing prescriptions, records, patient management

---

## Implementation Plan

### Phase 1: Backend — Doctor Account Creation & APIs

#### File: `backend/controllers/admin.controller.js`

**Change**: Update `createDoctor` function

- Create a `User` account with `role: 'doctor'`, auto-generated password
- Hash the password with bcrypt
- Create a `Doctor` record linked to the new `User` via `userId`
- Send credentials back to admin (or email to doctor)
- This gives each doctor their own email + password for login

#### File: `backend/controllers/doctor.controller.js`

**Add new functions**:

- `getMyPatients(req, res)` — Get unique patients from doctor's appointments, with their basic info
- `getPatientDetails(req, res)` — Get full patient profile + medical history for a given patient ID
- `uploadPatientRecord(req, res)` — Allow doctor to upload a medical record/report for a patient
- `completeAppointment(req, res)` — Mark appointment as completed (for after consultation)

#### File: `backend/routes/doctor.routes.js`

**Add new routes** (all protected with `doctorAuth`):

- `GET /doctors/mypatients` → `getMyPatients`
- `GET /doctors/patients/:id` → `getPatientDetails`
- `POST /doctors/records` → `uploadPatientRecord` (with multer)
- `PUT /doctors/appointments/:id/complete` → `completeAppointment`

#### File: `backend/controllers/appointment.controller.js`

**Add**:

- `completeAppointment` — Set status to "completed", doctor-only

#### File: `backend/controllers/prescription.controller.js`

**Add**:

- `getPrescriptionsForPatient` — Get all prescriptions a doctor has written for a specific patient

---

### Phase 2: Backend — Fixes to Existing APIs

#### File: `backend/routes/appointment.routes.js`

**Add**:

- `PUT /appointments/complete/:id` → `completeAppointment` (doctorAuth)

#### File: `backend/routes/prescription.routes.js`

**Add**:

- `GET /prescriptions/patient/:id` → `getPrescriptionsForPatient` (doctorAuth)

---

### Phase 3: Frontend — Comprehensive Doctor Dashboard

#### File: `frontend/src/pages/DoctorDashboard.jsx` (Complete Rewrite)

**Features to add**:

1. **Stats Overview Cards**:
   - Total Appointments
   - Pending Appointments
   - Confirmed Appointments
   - Today's Appointments
   - Total Patients

2. **Appointments Management Section**:
   - Tabs: All / Pending / Confirmed / Completed / Cancelled
   - Table/List view with patient info, date, time, status
   - Action buttons per appointment:
     - Pending → Accept (confirm) / Reject
     - Confirmed → Complete / Cancel
     - View patient details button

3. **Patient List Section**:
   - List of all unique patients who have appointments with this doctor
   - Search/filter patients
   - Click to view patient detail modal

4. **Patient Detail Modal**:
   - Patient basic info (name, email, phone, health profile)
   - Medical history
   - Past appointments with this doctor
   - Prescriptions given by this doctor
   - Medical records
   - Button to "Create Prescription"
   - Button to "Upload Report"

5. **Create Prescription Modal**:
   - Form with medicines list (name, dosage, duration, frequency)
   - Notes and instructions fields
   - Submit → calls `/api/prescriptions/create`

6. **Upload Medical Record Modal**:
   - File upload (PDF, image)
   - Record type selector (report, scan, lab-result, other)
   - Description field
   - Submit → calls `/api/doctors/records`

7. **Toast Notifications**:
   - Success/error feedback for all actions

8. **Responsive Design**:
   - Mobile-friendly layout matching existing Dashboard.jsx style

---

### Phase 4: Frontend — Navigation & Routing

#### File: `frontend/src/components/Navbar.jsx`

**Update** `getNavLinks` for doctor role:

- Doctor Dashboard
- Patients
- Profile
- Logout

#### File: `frontend/src/App.jsx`

**Verify** existing doctor route works:

- `/doctor/dashboard` → `DoctorDashboard` (already exists, just needs enhancement)

---

### Phase 5: Testing & Validation

1. Create a doctor via admin API
2. Login as doctor using the provided credentials
3. Verify doctor dashboard loads
4. Test appointment accept/reject/complete flow
5. Test prescription creation
6. Test medical record upload
7. Test patient detail view

---

## Files to Edit

| #   | File                                             | Change Type                      |
| --- | ------------------------------------------------ | -------------------------------- |
| 1   | `backend/controllers/admin.controller.js`        | Modify `createDoctor`            |
| 2   | `backend/controllers/doctor.controller.js`       | Add 4 new functions              |
| 3   | `backend/controllers/appointment.controller.js`  | Add `completeAppointment`        |
| 4   | `backend/controllers/prescription.controller.js` | Add `getPrescriptionsForPatient` |
| 5   | `backend/routes/doctor.routes.js`                | Add 4 new routes                 |
| 6   | `backend/routes/appointment.routes.js`           | Add complete route               |
| 7   | `backend/routes/prescription.routes.js`          | Add patient prescriptions route  |
| 8   | `frontend/src/pages/DoctorDashboard.jsx`         | Complete rewrite                 |
| 9   | `frontend/src/components/Navbar.jsx`             | Update doctor nav links          |
| 10  | `frontend/src/App.jsx`                           | Verify routing                   |

## Dependencies

- No new npm packages needed (already have multer, bcrypt, jwt, etc.)
