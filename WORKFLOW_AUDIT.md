# HealthAI – Complete Workflow Audit

**Audit Date:** 2026-11-05  
**Coverage:** End-to-end workflow tracing for all user roles

---

## 1. Authentication Workflows

### 1.1 Patient Registration

| Step | Component/File | Action | Status |
|------|---------------|--------|--------|
| 1 | `Register.jsx` | User fills form: firstName, lastName, email, phone, password | ⚠️ **BUG** – field named `phone`, backend expects `mobile` |
| 2 | `authStore.js` → `api.post('/auth/signup')` | Sends payload to backend | ✅ |
| 3 | `auth.controller.js` → `signup()` | Validates, hashes password, creates User with role=patient | ✅ |
| 4 | Email sent via Nodemailer | Welcome email dispatched (silently skipped if no EMAIL creds) | ✅ |
| 5 | JWT token created | Signs `{ id, email, role }`, 7-day expiry | ✅ |
| 6 | Response: `{ success, token, user }` | `user` contains `{ id, firstName, lastName, email, role }` | ✅ |
| 7 | `authStore` sets `token` + `user` | Stored in Zustand, token persisted to localStorage | ✅ |
| 8 | Navigate to `/dashboard` | Correct for patient role | ✅ |

**Broken:** Phone number submitted as `phone` but stored in DB as `mobile`. Phone is silently lost on registration.

---

### 1.2 Doctor Registration

| Step | Component/File | Action | Status |
|------|---------------|--------|--------|
| 1 | `DoctorRegister.jsx` | User fills all fields including days/slots availability | ✅ |
| 2 | `api.post('/auth/doctor-signup')` | Correct field names (`mobile`), availability object | ✅ |
| 3 | `auth.controller.js` → `doctorSignup()` | Creates User (role=doctor) + Doctor profile with status=active | ✅ |
| 4 | JWT token returned | ✅ | ✅ |
| 5 | `setAuth(token, user)` called | `user` correctly populated | ✅ |
| 6 | Navigate to `/doctor/dashboard` | ✅ | ✅ |

**Status:** Fully functional.

---

### 1.3 Patient / Doctor / Admin Login

| Step | Component/File | Action | Status |
|------|---------------|--------|--------|
| 1 | Login form submitted | `login({ email, password })` called in store | ✅ |
| 2 | `api.post('/auth/login')` | Backend validates email/password | ✅ |
| 3 | `auth.controller.js` → `login()` | bcrypt compare, JWT sign | ✅ |
| 4 | **Error path in login** | `catch` block returns `err?.stack` in response | ❌ **CRITICAL** – exposes stack trace |
| 5 | Role check in frontend | `Login.jsx` verifies `role === 'patient'`, otherwise logs out | ✅ |
| 6 | `DoctorLogin.jsx` | Verifies `role === 'doctor'` | ✅ |
| 7 | `AdminLogin.jsx` | Verifies `role === 'admin'` — does NOT call logout before nav | ⚠️ Minor – non-patient/doctor logged in as admin with wrong role won't be cleaned up |
| 8 | JWT stored | Token in localStorage via Zustand persist | ✅ |

---

### 1.4 Logout

| Step | Action | Status |
|------|--------|--------|
| 1 | `logout()` called in authStore | Clears `user` and `token` | ✅ |
| 2 | `window.location.replace('/')` | Redirect to Welcome | ✅ |
| 3 | Server-side session invalidation | Not implemented (JWT is stateless — expected) | ℹ️ Acceptable |

---

### 1.5 Forgot Password / Password Reset

**Status: NOT IMPLEMENTED.** No route, no controller, no frontend page exists. Users who forget passwords cannot recover their accounts.

---

## 2. Patient Workflow

### 2.1 Patient Dashboard

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Load profile | `GET /api/users/profile` | `user.controller.js:getProfile` | ✅ |
| Load appointments | `GET /api/appointments/my` | `appointment.controller.js:getMyAppointments` | ✅ |
| Load notifications | `GET /api/notifications` | `notification.controller.js:getNotifications` | ✅ |
| Load prescriptions | `GET /api/prescriptions/mine` | `prescription.controller.js:getPatientPrescriptions` | ✅ |
| Load doctors list | `GET /api/doctors` | `doctor.controller.js:getDoctors` | ✅ |
| Book appointment | `POST /api/appointments/book` | `appointment.controller.js:bookAppointment` | ✅ (but `toast.loading` never dismissed on `onMutate`) |
| Cancel appointment | `PUT /api/appointments/cancel/:id` | `appointment.controller.js:cancelAppointment` | ✅ |
| Welcome greeting | Shows `profile?.firstName` | Profile loaded from API | ✅ |

**Bug:** `bookMutation.onMutate` calls `toast.loading(...)` but never passes an `id`, so the loading toast is NOT dismissed before `toast.success` fires — resulting in stacked toasts.

---

### 2.2 Profile Management

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| View profile | Shows `firstName`, `lastName`, `email` | From `/api/users/profile` | ✅ |
| View phone | Shows `profile?.phone` | DB field is `mobile` | ❌ **BUG** – always shows "Not set" |
| Update health metrics | `PUT /api/users/profile` | `updateProfile()` | ✅ |
| BMI calculation | Calculated in backend on save | In `updateProfile` and `getProfile` | ✅ |

---

### 2.3 Browse Doctors

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| List doctors | `GET /api/doctors` | Returns all active doctors with pagination | ✅ |
| Search by name/specialty | Search input in `Doctors.jsx` | Not connected to state, no handler | ❌ **BUG** – search bar is a static input, does nothing |
| Doctor cards | Show name, specialization, experience, fees | ✅ | ✅ |
| Ratings shown | Hardcoded `4.9 (124 reviews)` | Not from real data | ❌ **FAKE DATA** |
| Book appointment | Opens modal, calls `/appointments/book` | ✅ | ✅ |

---

### 2.4 Appointment Booking

| Step | Action | Status |
|------|--------|--------|
| 1 | Patient clicks "Book Now" → `AppointmentDateTimeModal` opens | ✅ |
| 2 | Patient selects date (min = today) and time | ✅ |
| 3 | `POST /api/appointments/book` with `{ doctorId, date, time }` | ✅ |
| 4 | `Appointment` created with status=pending | ✅ |
| 5 | Notification to patient/doctor | ❌ **NOT IMPLEMENTED** – no notification created on booking |
| 6 | Doctor sees appointment in their dashboard | ✅ (if doctor is properly linked) |

---

### 2.5 Prescriptions

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| View prescriptions | `GET /api/prescriptions/mine` | Gets appointments → finds prescriptions | ✅ |
| Doctor name shown | `presc.doctorId?.firstName` | Prescription.doctorId refs User model | ✅ |
| Medicine details | name, dosage, duration, frequency | ✅ | ✅ |

---

### 2.6 Medical Records Upload

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Upload file | `POST /api/users/records` (multipart) | Multer + MedicalRecord save | ✅ |
| View records | `GET /api/users/records` | Returns MedicalRecord docs | ✅ |
| View file | Link to `http://127.0.0.1:5000/{rec.path}` | Static file server on `/uploads` | ⚠️ Hardcoded IP, no auth on static files |
| File type validation | No restriction | Multer accepts any file type | ❌ **SECURITY BUG** |
| File size limit | No limit set | Multer has no `limits` config | ❌ **SECURITY BUG** |

---

## 3. Doctor Workflow

### 3.1 Doctor Dashboard

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Load appointments | `GET /api/appointments/doctor` | Uses Doctor.findOne({ userId }) + fallback name match | ✅ |
| Confirm appointment | `PUT /api/appointments/confirm/:id` | Status → confirmed | ✅ |
| Reject appointment | `PUT /api/appointments/reject/:id` | Status → rejected | ✅ |
| Complete appointment | `PUT /api/appointments/complete/:id` | Status → completed | ✅ |
| Create prescription | `POST /api/prescriptions/create` | Creates Prescription, links to Appointment | ✅ |
| Load patients | `GET /api/doctors/mypatients` | Finds unique patients from appointments | ✅ |
| Search patients | Filter by name/email in frontend | Client-side filter | ✅ |
| Today's schedule | Filter `appointments` by today's date string | ✅ (relies on date string format matching) | ⚠️ |
| Upload patient record | `POST /api/doctors/records` | doctorAuth + Multer | ✅ |

---

### 3.2 Patient Detail Modal

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Load patient details | `GET /api/doctors/patients/:id` | Returns patient, medicalHistory, appointments, prescriptions, records | ✅ |
| Medical history tab | Shows bloodGroup, allergies, etc. | From MedicalHistory model | ✅ |
| Appointments tab | Patient's appointments with this doctor | ✅ | ✅ |
| Prescriptions tab | Patient's prescriptions | ✅ | ✅ |
| Records tab | Patient's file uploads | ✅ | ✅ |

---

## 4. Admin Workflow

### 4.1 Admin Dashboard

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| List doctors | `GET /api/admin/doctors` | Returns all doctors | ✅ |
| Create doctor | `POST /api/admin/doctors` | Creates User + Doctor | ✅ (but exposes plaintext password in response) |
| Approve doctor | `PUT /api/admin/doctors/:id` `{ status: 'active' }` | Updates Doctor.status | ✅ |
| Delete doctor | `DELETE /api/admin/doctors/:id` | Deletes Doctor doc only | ⚠️ Does NOT delete User account |
| View appointments | `GET /api/admin/appointments` | All appointments with populated user/doctor | ✅ |
| Dashboard stats | `GET /api/admin/stats` | Counts from DB | ✅ (counts `status:'booked'` but enum has 'pending') |
| Manage users | `GET /api/admin/users` | Frontend tab not implemented | ❌ No users tab in AdminDashboard |
| Block users | `PUT /api/admin/users/:id` | Route exists | ⚠️ No UI for it |
| Analytics | `GET /api/analytics/*` | Charts not shown in frontend | ❌ Not integrated in UI |

---

## 5. AI Chatbot Workflow

### 5.1 End-to-End Chat Flow

| Step | Component | Action | Status |
|------|-----------|--------|--------|
| 1 | `AITools.jsx` | User types message and submits | ✅ |
| 2 | `chatApi.post('/chat/chat', { message })` | Frontend sends request | ✅ |
| 3 | `chat.routes.js` | `POST /chat` → `chatWithAI` | ⚠️ Mounted at `/api/chat`, route is `/chat` → final URL is `/api/chat/chat` |
| 4 | `chat.controller.js` | Calls OpenAI or mock | ✅ |
| 5 | Response saved to DB | Chat history per userId | ✅ |
| 6 | `{ success, reply }` returned | ✅ | ✅ |
| 7 | Message appended to `chatMessages` state | ✅ | ✅ |
| 8 | Chat history pre-loaded on page open | ❌ **NOT IMPLEMENTED** – history starts empty each page load |

**Medical safety:** AI is given a system prompt limiting it to fitness/health advice, with instruction to not give dangerous prescriptions. Mock fallback also avoids dangerous suggestions. Adequate for a non-clinical tool.

---

### 5.2 Symptom Checker Flow

| Step | Action | Status |
|------|--------|--------|
| 1 | User describes symptoms | ✅ |
| 2 | `symptomApi.post('/symptom/check', { symptoms })` | ✅ |
| 3 | `sympton.controller.js` (typo in filename) | OpenAI or mock → JSON parsed | ✅ |
| 4 | Result saved to Symptom model with userId | ✅ |
| 5 | Result displayed: condition, severity, advice, medicines | ✅ |

---

### 5.3 Workout Generator Flow

| Step | Action | Status |
|------|--------|--------|
| 1 | User enters goal | ✅ |
| 2 | Frontend reads `profile.healthProfile.weight` and `height` | ✅ (shows error if not set) |
| 3 | `workoutApi.post('/workout/workout', ...)` | ⚠️ Frontend posts to `/workout/workout` — route mounted at `/api/workout`, handler is `router.post('/workout')` → URL is `/api/workout/workout` ✅ works but misleading |
| 4 | `workout.controller.js` | OpenAI or mock → JSON parsed | ✅ |
| 5 | Saved to Workout model (no userId) | ⚠️ Cannot associate with user |
| 6 | Plan displayed as list | ✅ |

---

## 6. Notification Workflow

| Scenario | Expected | Actual Status |
|----------|----------|---------------|
| Appointment booked | Notification to patient + doctor | ❌ Not created anywhere |
| Appointment confirmed | Notification to patient | ❌ Not created |
| Appointment rejected | Notification to patient | ❌ Not created |
| Prescription created | Notification to patient | ❌ Not created |
| Doctor review submitted | Notification to doctor | ✅ Created in review.controller.js |
| System announcement | Broadcast to role targets | ✅ (via systemNotification.controller.js, but UI missing) |

---

## 7. Summary: Broken Workflows

| # | Workflow | Issue |
|---|----------|-------|
| 1 | Patient registration | Phone field name mismatch (`phone` → `mobile`) |
| 2 | Patient profile | Phone always shows "Not set" |
| 3 | Doctor search | Search bar is non-functional |
| 4 | Doctor ratings | Hardcoded fake data |
| 5 | Appointment booking | Loading toast stacks (not dismissed) |
| 6 | Notifications | Not created for booking/confirmation/rejection/prescription |
| 7 | AI chat | History not loaded from DB on page open |
| 8 | Admin stats | Counts `status:'booked'` which doesn't exist in Appointment enum |
| 9 | Admin dashboard | No UI for user management or analytics |
| 10 | Forgot password | Completely missing |
| 11 | Delete doctor (admin) | Only deletes Doctor doc, not User account |
| 12 | Workout history | Not associated with user (no userId in Workout model) |
