# RBAC Implementation Audit

**Date:** 2026-11-05  
**Project:** HealthAI Tracking System  
**Scope:** Full role-based authentication and dashboard architecture

---

## 1. Existing Architecture

### Stack
- Backend: Node.js + Express v5, MongoDB/Mongoose v9, JWT, bcryptjs
- Frontend: React 18 + Vite, Zustand (auth state), React Query v5, TailwindCSS

### Backend Entry Point: `backend/server.js`
- `app.use(cors())` — no origin restriction (security issue)
- No rate limiting
- No global error handler
- Routes mounted at `/api/*`

---

## 2. Existing Authentication Workflow

1. Separate pages: `Login.jsx`, `DoctorLogin.jsx`, `AdminLogin.jsx`, `Register.jsx`, `DoctorRegister.jsx`
2. Login hits `POST /api/auth/login` — single endpoint for all roles
3. JWT signed with `{ id, email, role }`, 7-day expiry
4. Frontend role-checks after login and logs out if wrong portal
5. Token stored in Zustand + persisted to localStorage
6. `checkAuth()` calls `GET /api/users/profile` on every page load

---

## 3. Existing Database Models

| Model | File | Key Fields |
|-------|------|-----------|
| User | auth.model.js | firstName, lastName, email, mobile, password, role[admin/doctor/patient], status[pending/active/blocked/inactive], healthProfile |
| Doctor | Doctor.js | userId→User, name, specialization, experience, fees, availability, status |
| Appointment | Appointment.js | userId→User, doctorId→Doctor, date(String), time, status |
| Prescription | Prescription.js | appointmentId, doctorId→User, medicines[] |
| MedicalRecord | MedicalRecord.js | userId, appointmentId, filename, path, contentType, size, type, uploadedBy |
| MedicalHistory | MedicalHistory.model.js | userId, bloodGroup, allergies, chronicDiseases, medications |
| Notification | Notification.js | userId, type[appointment/prescription/review/message/reminder] |
| Review | Review.js | userId, doctorId, appointmentId, rating |
| Symptom | Symptom.model.js | userId, symptoms, condition, severity, advice |
| Workout | workout.model.js | weight, height, goal, bmi, plan (NO userId) |
| chat | chat.model.js | userId, messages[] |
| AdminLog | AdminLog.js | adminId, action(enum), targetId, details |
| SystemNotification | SystemNotification.js | title, message, type, targetRoles[], createdBy |

---

## 4. Existing API Routes

| Route | Auth | Issues |
|-------|------|--------|
| POST /api/auth/signup | Public | Creates patient role only |
| POST /api/auth/doctor-signup | Public | ⚠️ Anyone can register as doctor |
| POST /api/auth/login | Public | Returns stack trace on error |
| GET /api/users/profile | auth | OK |
| PUT /api/users/profile | auth | No mass-assignment protection |
| POST /api/doctors/add | None | ⚠️ COMPLETELY UNPROTECTED |
| GET /api/doctors | Public | OK |
| GET/POST/PUT/DELETE /api/admin/* | adminAuth | Only checks role==='admin' |
| POST /api/medical/medical | None | ⚠️ UNPROTECTED |
| GET /uploads/* | Public | ⚠️ ALL FILES PUBLIC |

---

## 5. Existing Dashboard Routes (Frontend)

| Route | Component | Guard |
|-------|-----------|-------|
| /login | Login.jsx | redirect if token |
| /register | Register.jsx | redirect if token |
| /doctor/login | DoctorLogin.jsx | redirect if token |
| /doctor/register | DoctorRegister.jsx | redirect if token |
| /admin/login | AdminLogin.jsx | redirect if token |
| /admin/signup | AdminSignup.jsx (disabled) | redirect if token |
| / | Welcome.jsx | none |
| /dashboard | Dashboard.jsx | ProtectedRoute |
| /doctor/dashboard | DoctorDashboard.jsx | ProtectedRoute allowedRoles=['doctor'] |
| /admin | AdminDashboard.jsx | ProtectedRoute allowedRoles=['admin'] |
| /doctors | Doctors.jsx | ProtectedRoute |
| /profile | Profile.jsx | ProtectedRoute |
| /prescriptions | Prescriptions.jsx | ProtectedRoute |
| /medical-records | MedicalRecords.jsx | ProtectedRoute |
| /ai-tools | AITools.jsx | ProtectedRoute |

---

## 6. Missing Functionality

- No `protected_admin` or `super_admin` roles
- No single login page (3 separate login pages)
- No forgot password / password reset
- Doctor registration is publicly open
- Admin signup disabled but no bootstrap mechanism
- No rate limiting on auth endpoints
- No medical record access logging
- No CORS restriction
- No file type/size validation
- No authenticated file download
- Notifications not created on appointment/prescription events
- No super admin dashboard
- No protected admin dashboard
- `user.name` referenced in Navbar (doesn't exist — only firstName/lastName)

---

## 7. Security Issues

| ID | Issue | Severity |
|----|-------|----------|
| S-01 | Stack trace in login error response | CRITICAL |
| S-02 | No .env file (JWT_SECRET undefined) | CRITICAL |
| S-03 | Plaintext password in createDoctor response | CRITICAL |
| S-04 | ReferenceError crash in review controller | CRITICAL |
| S-05 | POST /api/doctors/add unprotected | HIGH |
| S-06 | POST /api/medical/medical unprotected | HIGH |
| S-07 | Public doctor self-registration | HIGH |
| S-08 | CORS allows all origins | HIGH |
| S-09 | No rate limiting | HIGH |
| S-10 | No file validation | HIGH |
| S-11 | All uploaded files publicly accessible | HIGH |

---

## 8. Files That Need Modification

### Backend
- `backend/models/auth.model.js` — extend role enum, add createdBy
- `backend/middleware/auth.middleware.js` — add authorizeRoles(), improve
- `backend/controllers/auth.controller.js` — fix login (no stack trace), block doctor self-register
- `backend/controllers/admin.controller.js` — fix pending status, fix password exposure
- `backend/controllers/review.controller.js` — add missing Appointment import
- `backend/routes/auth.routes.js` — remove doctor-signup from public
- `backend/routes/admin.routes.js` — expand for new roles
- `backend/routes/doctor.routes.js` — add auth to /add
- `backend/routes/medicalHistory.routes.js` — add auth, fix double path
- `backend/server.js` — add CORS origin, rate limiting, global error handler, new routes

### Frontend
- `frontend/src/App.jsx` — consolidate routes, new dashboards
- `frontend/src/stores/authStore.js` — support 4 roles
- `frontend/src/components/Navbar.jsx` — fix name display, add new roles
- `frontend/src/components/ProtectedRoute.jsx` — fix role redirect
- `frontend/src/pages/Login.jsx` — replace with unified auth page
- `frontend/src/pages/Register.jsx` — merge into unified page
- `frontend/src/pages/Dashboard.jsx` — phone field fix, doctor name fix

---

## 9. Files That Need Creation

### Backend
- `backend/utils/aiClient.js` — shared OpenAI client
- `backend/utils/bootstrap.js` — protected_admin seeding
- `backend/routes/superAdmin.routes.js`
- `backend/controllers/superAdmin.controller.js`
- `backend/models/AuditLog.js` — medical record access log

### Frontend
- `frontend/src/pages/AuthPage.jsx` — single login/signup page
- `frontend/src/pages/ProtectedAdminDashboard.jsx`
- `frontend/src/pages/SuperAdminDashboard.jsx`

---

## 10. Potential Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|-----------|
| Role enum change: `admin` → `protected_admin`/`super_admin`, `patient` → `user` | Existing `admin`/`patient` records need migration | Keep old values in enum during transition, run migration script |
| `/doctor/register` removed | Doctors can no longer self-register | Admin creates doctor accounts |
| Single auth page replaces 3 login pages | Old routes (`/login`, `/doctor/login`) redirect | Add redirect from old routes |
| `GET /uploads/*` auth gated | Frontend links to files break | Update file URLs to use authenticated endpoint |

---

## 11. Implementation Plan Summary

**Phase 1-2:** Backend model + middleware (no breaking UI changes)  
**Phase 3-5:** Backend controllers/routes fully updated  
**Phase 6:** Single auth page (old routes redirect)  
**Phase 7-10:** Dashboard UIs  
**Phase 11:** Documentation  
**Phase 12:** Startup verification
