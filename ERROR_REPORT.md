# HealthAI – Error Report

**Audit Date:** 2026-11-05  
**Methodology:** Full source-code inspection, line-by-line tracing

---

## Severity Classification

| Level | Definition |
|-------|-----------|
| CRITICAL | Will crash the app, data loss, or enables unauthorized access |
| HIGH | Feature completely broken or security vulnerability |
| MEDIUM | Feature partially broken or bad UX |
| LOW | Code quality / minor bugs / technical debt |

---

## Backend Errors

| # | Module | File | Line/Function | Error | Root Cause | Severity |
|---|--------|------|---------------|-------|-----------|----------|
| B-01 | Server startup | `backend/.env` (missing) | – | **Server cannot start**: `MONGO_URI` is undefined, `mongoose.connect(undefined)` throws | No `.env` file exists in the repo. `.gitignore` intentionally excludes it but no `.env.example` exists either | **CRITICAL** |
| B-02 | Auth | `auth.controller.js:login()` | ~L.168 | **Stack trace exposed in HTTP response**: `error: err?.message, stack: err?.stack` returned to client | Developer debug code left in catch block | **CRITICAL** |
| B-03 | Admin | `admin.controller.js:createDoctor()` | ~L.105 | **Plaintext password returned to client**: `credentials: { email, password }` in response JSON | Intentional but insecure "admin convenience" comment | **CRITICAL** |
| B-04 | Review | `review.controller.js:createReview()` | ~L.10 | **ReferenceError crash**: `Appointment` is used but never imported | Missing `const Appointment = require('../models/Appointment')` at top of file | **CRITICAL** |
| B-05 | Medical History | `medicalHistory.routes.js` + `server.js` | L.5 of routes | **Double URL path**: Route registered as `router.post('/medical', ...)` mounted at `/api/medical` → final URL is `/api/medical/medical` instead of `/api/medical` | Route path duplicates the mount path | **HIGH** |
| B-06 | Doctors | `doctor.routes.js:addDoctor` | L.9 | **Unprotected doctor add endpoint**: `POST /api/doctors/add` has no auth middleware | No `auth` or `adminAuth` guard — anyone can add a doctor | **HIGH** |
| B-07 | Admin | `admin.controller.js:dashboardStats()` | ~L.18 | **Wrong status value**: Counts `status: 'booked'` but Appointment enum only has `pending/confirmed/completed/cancelled/rejected` | Copy-paste error — `'booked'` never exists, count always returns 0 | **HIGH** |
| B-08 | System Notification | `systemNotification.controller.js:createSystemNotification()` | L.19 | **Enum violation**: Tries to create Notification with `type: 'system'` but Notification schema enum is `[appointment, prescription, review, message, reminder]` — will throw Mongoose validation error | Notification schema does not include 'system' | **HIGH** |
| B-09 | Appointments | `Appointment.js` model | L.8 | **Date stored as String, not Date**: `date: String` prevents date comparison, sorting, and range queries | Initial schema design decision — no Date type used | **HIGH** |
| B-10 | Data model | `Prescription.js:doctorId` | L.9 | **Cross-model ref inconsistency**: `doctorId` refs `User` model while `Appointment.doctorId` refs `Doctor` model — populate results differ between the two | Inconsistent schema design | **HIGH** |
| B-11 | Admin Log | `adminLog.middleware.js:logAdminAction()` | L.7-12 | **targetId hardcoded at middleware definition time**: `targetId` is passed as a static parameter when the middleware is defined, not from `req.params` — always logs the same static value | Middleware factory receives static value, not dynamic request data | **MEDIUM** |
| B-12 | Workout | `workout.controller.js` | L.1-50 | **Duplicate OpenAI client initialization**: `openai` and `openaiClient` are both initialized at module scope with nearly identical logic | Refactoring artifact — `getOpenAICompatibleClient()` function defined in both chat and workout controllers | **MEDIUM** |
| B-13 | Admin delete doctor | `admin.controller.js:deleteDoctor()` | ~L.80 | **Orphan User account**: Deleting a doctor only removes the `Doctor` document — User account with `role:'doctor'` remains and can still log in | Missing `User.findByIdAndDelete(doctor.userId)` in delete handler | **MEDIUM** |
| B-14 | Auth | `auth.routes.js` | – | **No forgot-password or reset-password routes** | Not implemented | **MEDIUM** |
| B-15 | Security | `server.js` | L.13 | **CORS allows all origins**: `app.use(cors())` with no configuration accepts requests from any origin | No origin whitelist | **HIGH** (see Security Audit) |
| B-16 | File uploads | `user.routes.js` / `doctor.routes.js` | Multer config | **No file type or size validation**: Multer accepts any file, any size | `multer({ dest: '...' })` with no `fileFilter` or `limits` | **HIGH** (see Security Audit) |
| B-17 | Medical History | `medicalHistory.controller.js:saveMedicalHistory()` | L.7 | **No authentication on medical history endpoint**: Route is public (no `auth` middleware) | Route uses no middleware in `medicalHistory.routes.js` | **HIGH** |
| B-18 | Notifications | All controllers that create appointments | – | **Notifications never created on appointment events**: booking, confirmation, rejection, prescription creation do not trigger Notification creation | Not implemented | **MEDIUM** |
| B-19 | Workout | `workout.model.js` | – | **No userId in Workout model**: Saved workout plans cannot be associated with a user | Missing `userId` field in schema | **MEDIUM** |
| B-20 | Auth | `auth.controller.js:signup()` | L.43 | **No lastName validation**: `lastName` not checked in required fields — could create users with empty last name silently | Incomplete validation | **LOW** |
| B-21 | Auth | `auth.controller.js:doctorSignup()` | Response | **doctorProfile returned in signup response**: Contains sensitive internal data like status, userId, __v | Over-exposed response | **LOW** |
| B-22 | Server | `server.js` | – | **No global error handler**: Express v5 requires explicit error-handling middleware; unhandled promise rejections in routes return empty responses | Missing `app.use((err, req, res, next) => {...})` | **MEDIUM** |
| B-23 | Server | `server.js` | – | **No rate limiting**: Login, signup, and AI endpoints have no rate limiting | No express-rate-limit configured | **HIGH** (see Security Audit) |

---

## Frontend Errors

| # | Module | File | Line/Function | Error | Root Cause | Severity |
|---|--------|------|---------------|-------|-----------|----------|
| F-01 | Patient Registration | `Register.jsx` | L.5 | **Phone field sends `phone`, backend stores `mobile`**: Phone number is silently lost on registration | State field named `phone` but User schema field is `mobile` | **HIGH** |
| F-02 | Navbar | `Navbar.jsx` | L.57 | **Username always shows "User"**: `user?.name` is referenced but auth store stores `user.firstName`/`user.lastName` | Auth response has `firstName`/`lastName`, not `name` | **HIGH** |
| F-03 | Profile | `Profile.jsx` | L.33 | **Phone always shows "Not set"**: Reads `profile?.phone` but DB field is `mobile` | Wrong field name in JSX | **HIGH** |
| F-04 | Doctors | `Doctors.jsx` | L.54-60 | **Search bar does nothing**: Input has no state, no onChange, no filtering | Input element missing `value`, `onChange` and filter logic | **HIGH** |
| F-05 | Dashboard | `Dashboard.jsx` | `bookMutation.onMutate` | **Stacking loading toasts**: `toast.loading(...)` called on `onMutate` with no `id`, never dismissed before `toast.success` fires | `onMutate` creates toast, `onSuccess` creates a second toast without dismissing the first | **MEDIUM** |
| F-06 | ProtectedRoute | `ProtectedRoute.jsx` | L.11 | **Doctors redirected to `/dashboard`**: If a doctor visits an unauthorized route, redirect goes to `/dashboard` (patient page) | `allowedRoles` mismatch redirects to `/dashboard` regardless of role | **MEDIUM** |
| F-07 | Auth Store | `authStore.js` | L.1-3 | **Mixed Zustand API**: Imports both `persist` from `zustand/middleware` and `createWithEqualityFn` from `zustand/traditional` — correct usage but unnecessarily complex | Minor inconsistency, works correctly | **LOW** |
| F-08 | AI Tools | `AITools.jsx` | workoutMutation | **Workout API call URL**: `workoutApi.post('/workout/workout', data)` — though the actual endpoint resolves correctly (`/api/workout` prefix + `/workout` route = `/api/workout/workout`), it is confusing and could break if mount path changes | Route structure creates double `/workout` | **LOW** |
| F-09 | AI Tools | `AITools.jsx` | sendChat | **Chat history not loaded from DB**: `chatMessages` state initializes empty — previous conversations are not fetched on page load | No `useQuery` to fetch `/api/chat/history` (endpoint doesn't exist) | **MEDIUM** |
| F-10 | App.jsx | `App.jsx` | Route definitions | **`useAuthStore.getState()` called during render**: Used in route `element` props instead of hook form — technically works but not React-idiomatic | Should use hook `useAuthStore` with selector | **LOW** |
| F-11 | Doctor Registration | `DoctorRegister.jsx` | handleSubmit | **Submits `selectedDays` and `selectedSlots` as separate fields**: Extra fields sent alongside `availability` object — backend ignores them but they pollute the request | Not destructured cleanly before send | **LOW** |
| F-12 | Admin Dashboard | `AdminDashboard.jsx` | – | **No user management tab**: `GET /api/admin/users` endpoint exists but no UI to view, block, or manage users | Incomplete feature | **MEDIUM** |
| F-13 | Admin Dashboard | `AdminDashboard.jsx` | – | **No analytics tab**: Analytics routes exist on backend but are completely unused by frontend | Incomplete feature | **LOW** |
| F-14 | Doctors page | `Doctors.jsx` | Doctor cards | **Fake review ratings**: Every doctor shows `4.9 (124 reviews)` hardcoded | Placeholder data never replaced | **MEDIUM** |
| F-15 | MedicalRecords | `MedicalRecords.jsx` | L.89 | **Hardcoded IP for file viewing**: `http://127.0.0.1:5000/${rec.path}` — breaks in production or any non-localhost environment | Should use `VITE_API_URL` or relative URL | **HIGH** |
| F-16 | Dashboard | `Dashboard.jsx` | Appointment cards | **Doctor name display broken for current architecture**: `apt.doctorId?.firstName` — `Appointment.doctorId` refs Doctor model which has `name`, not `firstName`/`lastName` | Appointment.doctorId points to Doctor, not User | **HIGH** |
| F-17 | Auth Store | `authStore.js` | `checkAuth` | **API call on every page reload**: Every refresh hits `GET /api/users/profile` to restore `user` object since only token is persisted | By design, but causes auth flash and extra network calls | **LOW** |

---

## Database / Model Errors

| # | Model | File | Error | Root Cause | Severity |
|---|-------|------|-------|-----------|----------|
| D-01 | Appointment | `Appointment.js` | `date` is `String` — no date operations, no sorting by date | Schema design: should be `Date` type | **HIGH** |
| D-02 | Prescription | `Prescription.js` | `doctorId` refs `User` while `Appointment.doctorId` refs `Doctor` | Inconsistent cross-model references | **HIGH** |
| D-03 | Review | `Review.js` | `doctorId` refs `User` while `Appointment.doctorId` refs `Doctor` — populate results differ | Inconsistent cross-model references | **MEDIUM** |
| D-04 | Workout | `workout.model.js` | No `userId` field — workout results cannot be attributed to a user | Missing field | **MEDIUM** |
| D-05 | Notification | `Notification.js` | enum missing `'system'` type, used in `systemNotification.controller.js` | Mismatch between controller and model | **HIGH** |
| D-06 | User | `auth.model.js` | `healthProfile.medicalHistory` array duplicates standalone `MedicalHistory` model | Two separate systems for same data | **MEDIUM** |
| D-07 | MedicalRecord | `MedicalRecord.js` | File stored on local disk (`path`), not cloud storage — will not work in multi-server or serverless deployments | No cloud storage configured | **MEDIUM** |
| D-08 | AdminLog | `AdminLog.js` | `ipAddress` and `userAgent` fields exist in schema but middleware stores them in `details` sub-object, not top-level fields | Schema/middleware mismatch | **LOW** |
| D-09 | All models | Various | No indexes beyond the Review unique index — `userId` foreign keys have no indexes | Missing compound indexes for performance | **LOW** |

---

## Summary Count

| Severity | Backend | Frontend | Database | Total |
|----------|---------|----------|----------|-------|
| CRITICAL | 4 | 0 | 0 | **4** |
| HIGH | 9 | 6 | 3 | **18** |
| MEDIUM | 7 | 5 | 3 | **15** |
| LOW | 3 | 6 | 2 | **11** |
| **Total** | **23** | **17** | **8** | **48** |
