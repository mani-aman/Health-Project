# HealthAI – Project Architecture

**Audit Date:** 2026-11-05  
**Auditor:** Senior Full-Stack MERN Architect

---

## 1. Project Overview

HealthAI is a full-stack MERN (MongoDB, Express, React, Node.js) web application for healthcare management. It provides:

- Patient self-service: registration, appointment booking, prescriptions, medical records, AI health tools
- Doctor portal: appointment management, prescriptions, patient details, record uploads
- Admin panel: doctor and user management, analytics
- AI tools: symptom checker, workout plan generator, health chatbot

---

## 2. Tech Stack

| Layer       | Technology                                              |
|-------------|--------------------------------------------------------|
| Frontend    | React 18 + Vite, TailwindCSS, Zustand, React Query v5  |
| Backend     | Node.js + Express v5, REST API                         |
| Database    | MongoDB with Mongoose v9                               |
| Auth        | JWT (jsonwebtoken), bcryptjs                           |
| AI          | OpenAI API / OpenRouter (compatible), mock fallbacks   |
| Email       | Nodemailer + Gmail SMTP                                |
| File Upload | Multer (disk storage, `uploads/records/`)              |
| Build Tool  | Vite (frontend), nodemon (backend dev)                 |

---

## 3. Directory Structure

```
Health-Project/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── package.json               # Backend dependencies
│   ├── db/
│   │   └── db.js                  # MongoDB connection (mongoose.connect)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT auth + role guards (auth, adminAuth, doctorAuth)
│   │   └── adminLog.middleware.js  # Admin action logging
│   ├── models/
│   │   ├── auth.model.js           # User schema (patient/doctor/admin)
│   │   ├── Doctor.js               # Doctor profile schema
│   │   ├── Appointment.js          # Appointment schema
│   │   ├── Prescription.js         # Prescription schema
│   │   ├── MedicalRecord.js        # File upload metadata schema
│   │   ├── MedicalHistory.model.js # Standalone medical history
│   │   ├── chat.model.js           # AI chat message history
│   │   ├── Notification.js         # User notifications
│   │   ├── SystemNotification.js   # Admin broadcast notifications
│   │   ├── Review.js               # Doctor reviews
│   │   ├── Symptom.model.js        # Symptom checker results
│   │   ├── workout.model.js        # Workout plan results
│   │   └── AdminLog.js             # Admin action audit log
│   ├── routes/
│   │   ├── auth.routes.js          # POST /api/auth/{signup,login,doctor-signup}
│   │   ├── user.routes.js          # GET/PUT /api/users/{profile,records,prescriptions}
│   │   ├── doctor.routes.js        # GET/POST /api/doctors/*
│   │   ├── appointment.routes.js   # CRUD /api/appointments/*
│   │   ├── prescription.routes.js  # CRUD /api/prescriptions/*
│   │   ├── admin.routes.js         # Admin CRUD /api/admin/*
│   │   ├── adminSignup.routes.js   # Disabled admin signup
│   │   ├── chat.routes.js          # POST /api/chat/chat
│   │   ├── notification.routes.js  # GET/PATCH /api/notifications/*
│   │   ├── review.routes.js        # CRUD /api/reviews/*
│   │   ├── medicalHistory.routes.js# POST /api/medical/medical
│   │   ├── workout.routes.js       # POST /api/workout/workout
│   │   ├── symptom.routes.js       # POST /api/symptom/check
│   │   └── analytics.routes.js     # GET /api/analytics/*
│   ├── controllers/
│   │   ├── auth.controller.js      # signup, doctorSignup, login
│   │   ├── user.controller.js      # profile, records, prescriptions
│   │   ├── doctor.controller.js    # getDoctors, myPatients, patientDetails, uploadRecord
│   │   ├── appointment.controller.js
│   │   ├── prescription.controller.js
│   │   ├── admin.controller.js     # dashboardStats, doctor CRUD, user management
│   │   ├── adminSignup.controller.js
│   │   ├── chat.controller.js      # chatWithAI + DB persistence
│   │   ├── notification.controller.js
│   │   ├── review.controller.js
│   │   ├── workout.controller.js
│   │   ├── sympton.controller.js   # (typo in filename) symptomCheck
│   │   ├── analytics.controller.js
│   │   ├── medicalHistory.controller.js
│   │   └── systemNotification.controller.js
│   └── uploads/
│       └── records/               # File upload destination (local disk)
│
└── frontend/
    ├── vite.config.js             # Dev server port 3000, proxy /api → :5000
    ├── src/
    │   ├── main.jsx               # React entry, QueryClientProvider, Toaster
    │   ├── App.jsx                # Router, route definitions, auth check on mount
    │   ├── services/
    │   │   └── api.js             # Axios instance, baseURL env var, auth interceptor
    │   ├── stores/
    │   │   └── authStore.js       # Zustand store: token, user, login, signup, logout, checkAuth
    │   ├── pages/
    │   │   ├── Welcome.jsx        # Landing page with role-based entry buttons
    │   │   ├── Login.jsx          # Patient login
    │   │   ├── Register.jsx       # Patient registration
    │   │   ├── DoctorLogin.jsx    # Doctor login
    │   │   ├── DoctorRegister.jsx # Doctor registration with availability picker
    │   │   ├── AdminLogin.jsx     # Admin login
    │   │   ├── AdminSignup.jsx    # Disabled (shows message only)
    │   │   ├── Dashboard.jsx      # Patient dashboard (appointments, prescriptions, doctors, notifications)
    │   │   ├── DoctorDashboard.jsx# Doctor dashboard (appointments, patients, prescriptions)
    │   │   ├── AdminDashboard.jsx # Admin dashboard (doctor CRUD, appointments)
    │   │   ├── Doctors.jsx        # Public doctor listing + book appointment
    │   │   ├── Profile.jsx        # Patient health profile editor
    │   │   ├── Prescriptions.jsx  # Patient prescriptions list
    │   │   ├── MedicalRecords.jsx # Patient file upload & listing
    │   │   └── AITools.jsx        # Symptom checker, workout generator, AI chat
    │   └── components/
    │       ├── Navbar.jsx                        # Role-aware navigation
    │       ├── ProtectedRoute.jsx                # JWT guard + role guard
    │       ├── AppointmentDateTimeModal.jsx       # Date/time picker modal
    │       └── doctor/
    │           ├── PrescriptionModal.jsx         # Create prescription form
    │           ├── PatientDetailModal.jsx        # Patient details tabs
    │           └── UploadRecordModal.jsx         # Upload record for patient
```

---

## 4. API Route Map

| Method | Path                                | Auth         | Description                         |
|--------|-------------------------------------|--------------|-------------------------------------|
| POST   | /api/auth/signup                    | Public       | Patient registration                |
| POST   | /api/auth/doctor-signup             | Public       | Doctor registration                 |
| POST   | /api/auth/login                     | Public       | Login (all roles)                   |
| GET    | /api/users/profile                  | auth         | Get own profile                     |
| PUT    | /api/users/profile                  | auth         | Update health profile               |
| GET    | /api/users/prescriptions            | auth         | (Legacy) get own prescriptions      |
| POST   | /api/users/records                  | auth         | Upload medical record               |
| GET    | /api/users/records                  | auth         | Get own medical records             |
| GET    | /api/users/patients/:id/records     | doctorAuth   | Get patient records                 |
| GET    | /api/users/patients/:id/prescriptions| doctorAuth  | Get patient prescriptions           |
| GET    | /api/doctors                        | Public       | Get all active doctors              |
| POST   | /api/doctors/add                    | Public       | ⚠️ Unprotected doctor add           |
| GET    | /api/doctors/mypatients             | doctorAuth   | Get doctor's patients               |
| GET    | /api/doctors/patients/:id           | doctorAuth   | Get patient details                 |
| POST   | /api/doctors/records                | doctorAuth   | Doctor uploads patient record       |
| POST   | /api/appointments/book              | auth         | Book appointment                    |
| GET    | /api/appointments/my                | auth         | Patient's appointments              |
| GET    | /api/appointments/doctor            | doctorAuth   | Doctor's appointments               |
| PUT    | /api/appointments/cancel/:id        | auth         | Cancel appointment                  |
| PUT    | /api/appointments/confirm/:id       | doctorAuth   | Confirm appointment                 |
| PUT    | /api/appointments/reject/:id        | doctorAuth   | Reject appointment                  |
| PUT    | /api/appointments/complete/:id      | doctorAuth   | Complete appointment                |
| POST   | /api/prescriptions/create           | doctorAuth   | Create prescription                 |
| GET    | /api/prescriptions/my               | auth         | Get prescriptions (doctor or patient)|
| GET    | /api/prescriptions/doctor/my        | doctorAuth   | Doctor's prescriptions              |
| GET    | /api/prescriptions/patient/:id      | doctorAuth   | Patient's prescriptions (doctor view)|
| GET    | /api/prescriptions/mine             | auth         | Patient's own prescriptions         |
| GET    | /api/notifications                  | auth         | Get notifications                   |
| PATCH  | /api/notifications/:id/read         | auth         | Mark notification read              |
| PATCH  | /api/notifications/read-all         | auth         | Mark all read                       |
| POST   | /api/reviews                        | auth         | Create review                       |
| GET    | /api/reviews/my                     | auth         | Own reviews                         |
| GET    | /api/reviews/doctor/:doctorId       | Public       | Doctor reviews                      |
| POST   | /api/medical/medical                | Public       | ⚠️ Save medical history (no auth)   |
| POST   | /api/chat/chat                      | auth         | AI health chat                      |
| POST   | /api/workout/workout                | auth         | Generate workout plan               |
| POST   | /api/symptom/check                  | auth         | Symptom check                       |
| GET    | /api/admin/stats                    | adminAuth    | Dashboard stats                     |
| GET    | /api/admin/doctors                  | adminAuth    | All doctors                         |
| POST   | /api/admin/doctors                  | adminAuth    | Create doctor                       |
| PUT    | /api/admin/doctors/:id              | adminAuth    | Update doctor                       |
| DELETE | /api/admin/doctors/:id              | adminAuth    | Delete doctor                       |
| GET    | /api/admin/appointments             | adminAuth    | All appointments                    |
| PUT    | /api/admin/appointments/:id/status  | adminAuth    | Update appointment status           |
| GET    | /api/admin/users                    | adminAuth    | All users                           |
| PUT    | /api/admin/users/:id                | adminAuth    | Update user                         |
| GET    | /api/analytics/appointments         | adminAuth    | Appointment analytics               |
| GET    | /api/analytics/patients             | adminAuth    | Patient growth                      |
| GET    | /api/analytics/reviews              | adminAuth    | Review analytics                    |
| GET    | /uploads/*                          | Public       | ⚠️ Serve uploaded files (no auth)   |

---

## 5. Database Models & Relationships

```
User (auth.model.js)
  _id, firstName, lastName, email, mobile, password, role, status
  healthProfile: { age, height, weight, bmi, goal, allergies, chronicDiseases, ... }
  ↕ One-to-many → Appointments (userId)
  ↕ One-to-one  → Doctor profile (Doctor.userId)

Doctor (Doctor.js)
  _id, userId→User, name, specialization, experience, fees, availability, status
  ↕ One-to-many → Appointments (doctorId)

Appointment (Appointment.js)
  _id, userId→User, doctorId→Doctor, date(String), time, status, prescriptionId→Prescription

Prescription (Prescription.js)
  _id, appointmentId→Appointment, doctorId→User (⚠️ refs User, not Doctor), medicines[], notes

MedicalRecord (MedicalRecord.js)
  _id, userId→User, appointmentId→Appointment, filename, path, contentType, size, type, uploadedBy→User

MedicalHistory (MedicalHistory.model.js)
  _id, userId→User, bloodGroup, allergies[], chronicDiseases[], medications[]

Notification (Notification.js)
  _id, userId→User, doctorId→User, appointmentId→Appointment, prescriptionId→Prescription
  type: enum[appointment, prescription, review, message, reminder]

SystemNotification (SystemNotification.js)
  _id, title, message, type: enum[announcement, maintenance, update, alert]
  targetRoles[], createdBy→User

Review (Review.js)
  _id, userId→User, doctorId→User, appointmentId→Appointment, rating(1-5)
  Unique index on (userId, appointmentId)

Symptom (Symptom.model.js)
  _id, userId→User, symptoms, condition, severity, advice, medicines[]

Workout (workout.model.js)
  _id, weight, height, goal, bmi, plan[]
  ⚠️ No userId — cannot be associated with a user

chat (chat.model.js)
  _id, userId→User, messages[{role, content}], title

AdminLog (AdminLog.js)
  _id, adminId→User, action(enum), targetId, details, success
```

---

## 6. Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. Backend finds user by email, compares bcrypt hash
3. Signs JWT: `{ id, email, role }` with 7-day expiry
4. Frontend stores `token` in Zustand (persisted to localStorage via `persist` middleware)
5. On every page reload, `checkAuth()` calls `GET /api/users/profile` to hydrate `user` object
6. All protected routes attach `Authorization: Bearer <token>` header via axios interceptor
7. Backend `auth` middleware verifies JWT, sets `req.user = decoded`
8. Role guards (`adminAuth`, `doctorAuth`) check `req.user.role`

---

## 7. AI Integration Architecture

```
Frontend (AITools.jsx)
  → symptomApi.post('/symptom/check')    → sympton.controller.js → OpenAI/OpenRouter → Symptom saved to DB
  → workoutApi.post('/workout/workout')  → workout.controller.js → OpenAI/OpenRouter → Workout saved to DB
  → chatApi.post('/chat/chat')           → chat.controller.js   → OpenAI/OpenRouter → Chat saved to DB

All three controllers:
  1. Check for OPENROUTER_API_KEY or OPENAI_API_KEY in env
  2. If key available → call OpenAI-compatible API
  3. If no key → use mock fallback (keyword-based responses)
  4. Save result to MongoDB
  5. Return response to frontend
```

---

## 8. File Upload Architecture

```
Frontend FormData upload
  → POST /api/users/records (patient) or /api/doctors/records (doctor)
  → Multer middleware: dest = 'uploads/records/' (disk storage, auto-renamed)
  → MedicalRecord document saved with { filename, path, contentType, size }
  → Files served via: app.use('/uploads', express.static('uploads'))
```

---

## 9. Frontend State Management

```
Zustand (authStore)
  - token: string | null          (persisted to localStorage)
  - user: object | null           (NOT persisted — loaded from API on each mount)
  - isLoading: boolean
  - Actions: login, signup, setAuth, logout, checkAuth

React Query
  - Used for all server data: profile, appointments, doctors, prescriptions, records, notifications
  - Mutations for: book, cancel, confirm, reject, complete appointments; create prescriptions; upload records
  - QueryClient invalidation on mutation success
```

---

## 10. Environment Variables Required

```
# Backend (.env)
MONGO_URI=mongodb://...
JWT_SECRET=...
PORT=5000

# Email (optional — signup emails disabled if missing)
EMAIL_USER=
EMAIL_PASS=

# AI (optional — mock fallback used if missing)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Frontend (.env)
VITE_API_URL=http://127.0.0.1:5000/api
```
