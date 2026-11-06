# HealthAI – Fix Implementation Plan

**Audit Date:** 2026-11-05  
**Total Issues:** 48 (4 Critical, 18 High, 15 Medium, 11 Low)

---

## Fixing Philosophy

1. Fix one module at a time, smallest blast radius first
2. Do not rewrite working features — patch only what is broken
3. Every fix must be verified: server starts, existing tests pass, affected endpoint responds correctly
4. No hardcoded credentials
5. Do not change DB schemas without a migration plan

---

## Phase 1: Make the App Runnable (Prerequisites)

These must be done before anything else. Nothing works without them.

### P1-1: Create `.env` files

**Issues fixed:** B-01 (CRITICAL)

**Action:**
```bash
# backend/.env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/healthai
JWT_SECRET=<minimum-32-character-random-string>
PORT=5000
EMAIL_USER=
EMAIL_PASS=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
FRONTEND_URL=http://localhost:3000

# frontend/.env
VITE_API_URL=http://127.0.0.1:5000/api
```

**Also create:** `backend/.env.example` with all keys but empty values — commit this to git.

**Files:** `backend/.env` (new), `backend/.env.example` (new), `frontend/.env` (new)  
**Estimated effort:** 5 minutes

---

### P1-2: Fix Review Controller Missing Import

**Issues fixed:** B-04 (CRITICAL — will crash on any review submission)

**File:** `backend/controllers/review.controller.js`

**Change:** Add at line 2:
```js
const Appointment = require('../models/Appointment');
```

**Verification:** Call `POST /api/reviews` with a valid token — should not throw `ReferenceError: Appointment is not defined`.

---

## Phase 2: Critical Security Fixes

Do these immediately before the app is accessible to any real users.

### P2-1: Remove Stack Trace from Login Error

**Issues fixed:** SEC-02 / B-02 (CRITICAL)

**File:** `backend/controllers/auth.controller.js`, login() catch block

**Change:**
```js
// BEFORE
return res.status(500).json({
  success: false,
  message: "Server error",
  error: err?.message,
  stack: err?.stack,
});

// AFTER
return res.status(500).json({
  success: false,
  message: "Server error",
});
```

---

### P2-2: Remove Plaintext Password from createDoctor Response

**Issues fixed:** SEC-03 / B-03 (CRITICAL)

**File:** `backend/controllers/admin.controller.js`, createDoctor()

**Change:** Remove `credentials.password` from the response:
```js
// BEFORE
credentials: { email: user.email, password: password }

// AFTER — remove the credentials block entirely
// Doc in comment: Admin must note the password separately before creating the account
```

---

### P2-3: Protect POST /api/doctors/add

**Issues fixed:** SEC-04 / B-06 (HIGH)

**File:** `backend/routes/doctor.routes.js`

**Change:**
```js
const { adminAuth } = require('../middleware/auth.middleware');
router.post("/add", adminAuth, addDoctor);
```
Note: This route is legacy. Recommend deprecating in favor of `/api/admin/doctors`.

---

### P2-4: Add Auth to Medical History Endpoint

**Issues fixed:** SEC-05 / B-17 (HIGH)

**File:** `backend/routes/medicalHistory.routes.js`  
**File:** `backend/controllers/medicalHistory.controller.js`

```js
// routes/medicalHistory.routes.js
const { auth } = require('../middleware/auth.middleware');
router.post("/medical", auth, saveMedicalHistory);

// controllers/medicalHistory.controller.js — replace req.body.userId with req.user.id
const { bloodGroup, allergies, chronicDiseases, medications } = req.body;
const history = new MedicalHistory({
  userId: req.user.id,  // ← use authenticated user's id
  bloodGroup, allergies, chronicDiseases, medications,
});
```

---

### P2-5: Fix Double Route Path for Medical History

**Issues fixed:** B-05 (HIGH)

**File:** `backend/routes/medicalHistory.routes.js`

```js
// BEFORE
router.post("/medical", saveMedicalHistory);
// This results in /api/medical/medical

// AFTER
router.post("/", auth, saveMedicalHistory);
// This results in /api/medical
```

---

### P2-6: Restrict CORS Origins

**Issues fixed:** SEC-06 (HIGH)

**File:** `backend/server.js`

```js
// BEFORE
app.use(cors());

// AFTER
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

---

### P2-7: Add Rate Limiting

**Issues fixed:** SEC-07 / B-23 (HIGH)

**Install:** `npm install express-rate-limit`

**File:** `backend/server.js`

```js
const rateLimit = require('express-rate-limit');

// Strict limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/auth', authLimiter);

// General API limit
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
});
app.use('/api', generalLimiter);
```

---

### P2-8: Add File Type and Size Validation

**Issues fixed:** SEC-08 / B-16 (HIGH)

**Files:** `backend/routes/user.routes.js`, `backend/routes/doctor.routes.js`

```js
// Shared multer config (extract to a shared file)
const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: 'uploads/records/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
    }
  },
});
```

---

### P2-9: Add Authentication to File Download / Remove Public Static Serve

**Issues fixed:** SEC-09 (HIGH)

**File:** `backend/server.js` — Remove or restrict static file serving:
```js
// REMOVE or restrict:
// app.use("/uploads", express.static("uploads"));

// REPLACE with authenticated download endpoint in user.routes.js:
// GET /api/users/records/:id/download
```

**File:** `backend/routes/user.routes.js` — Add download endpoint:
```js
const path = require('path');
router.get('/records/:id/download', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ msg: 'Record not found' });
    res.sendFile(path.resolve(record.path));
  } catch (err) {
    res.status(500).json({ msg: 'Download failed' });
  }
});
```

**Frontend:** Update `MedicalRecords.jsx` — replace hardcoded `http://127.0.0.1:5000/${rec.path}` with:
```js
const fileUrl = `/api/users/records/${rec._id}/download`;
```

---

## Phase 3: Data Correctness Fixes

### P3-1: Fix Patient Registration Phone Field Name

**Issues fixed:** F-01 (HIGH)

**File:** `frontend/src/pages/Register.jsx`

```js
// BEFORE: state field is 'phone'
const [formData, setFormData] = useState({ firstName:'', lastName:'', email:'', password:'', phone:'' })

// AFTER: rename to 'mobile' to match backend schema
const [formData, setFormData] = useState({ firstName:'', lastName:'', email:'', password:'', mobile:'' })
// Update onChange: setFormData({ ...formData, mobile: e.target.value })
// Update label from "Phone" to "Phone / Mobile"
```

---

### P3-2: Fix Navbar User Display Name

**Issues fixed:** F-02 (HIGH)

**File:** `frontend/src/components/Navbar.jsx`

```js
// BEFORE
<span className="font-medium">{user?.name || 'User'}</span>

// AFTER
<span className="font-medium">
  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
</span>
```
Same fix for mobile menu display.

---

### P3-3: Fix Profile Phone Field Display

**Issues fixed:** F-03 (HIGH)

**File:** `frontend/src/pages/Profile.jsx`

```js
// BEFORE
<span>{profile?.phone || 'Not set'}</span>

// AFTER
<span>{profile?.mobile || 'Not set'}</span>
```

---

### P3-4: Fix Doctors Page Search Bar

**Issues fixed:** F-04 (HIGH)

**File:** `frontend/src/pages/Doctors.jsx`

```js
// Add state at top of component
const [searchTerm, setSearchTerm] = useState('')
const [specialization, setSpecialization] = useState('')

// Connect input
<input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search doctors by name or specialty..."
  ...
/>

// Filter doctors client-side (or pass as query params to API)
const filteredDoctors = useMemo(() =>
  (doctors || []).filter(d =>
    `${d.name} ${d.specialization}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [doctors, searchTerm]
)
```

---

### P3-5: Fix Appointment Card Doctor Name Display

**Issues fixed:** F-16 (HIGH)

**File:** `frontend/src/pages/Dashboard.jsx`

`Appointment.doctorId` populates from `Doctor` model which has `name` field, not `firstName`/`lastName`.

```js
// BEFORE
Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}

// AFTER
Dr. {apt.doctorId?.name || `${apt.doctorId?.firstName || ''} ${apt.doctorId?.lastName || ''}`.trim()}
```

---

### P3-6: Fix Admin dashboardStats — Wrong Appointment Status

**Issues fixed:** B-07 (HIGH)

**File:** `backend/controllers/admin.controller.js`, `dashboardStats()`

```js
// BEFORE
pendingAppointments: await Appointment.countDocuments({ status: 'booked' }),

// AFTER
pendingAppointments: await Appointment.countDocuments({ status: 'pending' }),
```

---

### P3-7: Fix SystemNotification Type Enum Mismatch

**Issues fixed:** B-08, D-05 (HIGH)

**Option A:** Add `'system'` to Notification schema enum:

**File:** `backend/models/Notification.js`
```js
type: {
  type: String,
  enum: ["appointment", "prescription", "review", "message", "reminder", "system"],
  required: true,
},
```

**Option B:** Change controller to use `'announcement'` type instead.

---

### P3-8: Fix ProtectedRoute Role Redirect

**Issues fixed:** F-06 (MEDIUM)

**File:** `frontend/src/components/ProtectedRoute.jsx`

```js
// BEFORE
return <Navigate to="/dashboard" replace />

// AFTER — redirect based on user role
const redirectPath = user?.role === 'doctor' ? '/doctor/dashboard'
  : user?.role === 'admin' ? '/admin'
  : '/dashboard';
return <Navigate to={redirectPath} replace />
```

---

### P3-9: Fix Booking Toast Stacking

**Issues fixed:** F-05 (MEDIUM)

**File:** `frontend/src/pages/Dashboard.jsx`, `bookMutation`

```js
bookMutation = useMutation({
  mutationFn: ({ doctorId, date, time }) => api.post('/appointments/book', { doctorId, date, time }),
  onMutate: () => {
    return toast.loading('Booking appointment...'); // returns toastId
  },
  onSuccess: (data, variables, toastId) => {
    toast.dismiss(toastId); // dismiss loading toast first
    toast.success('Appointment booked successfully!')
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  },
  onError: (err, variables, toastId) => {
    toast.dismiss(toastId);
    toast.error(err.response?.data?.message || 'Booking failed')
  },
})
```

---

### P3-10: Fix Medical Records File URL

**Issues fixed:** F-15 (HIGH)

**File:** `frontend/src/pages/MedicalRecords.jsx`

```js
// BEFORE
const fileUrl = rec?.path ? `http://127.0.0.1:5000/${rec.path}` : null

// AFTER — use authenticated download endpoint
const fileUrl = `/api/users/records/${rec._id}/download`
```
(Requires P2-9 to be done first)

---

### P3-11: Fix Admin Delete Doctor — Cascade to User

**Issues fixed:** B-13 (MEDIUM)

**File:** `backend/controllers/admin.controller.js`, `deleteDoctor()`

```js
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Delete User account too
    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
    }
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({ message: 'Doctor and user account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

## Phase 4: Feature Completion

### P4-1: Implement Notifications on Appointment Events

**Issues fixed:** B-18 (MEDIUM)

**File:** `backend/controllers/appointment.controller.js`

Add `Notification.create()` calls in:
- `bookAppointment()` — notify doctor
- `confirmAppointment()` — notify patient
- `rejectAppointment()` — notify patient
- `prescription.controller.js:createPrescription()` — notify patient

Example in bookAppointment:
```js
const Notification = require('../models/Notification');
// After appointment.create():
await Notification.create({
  userId: doctor.userId,       // notify the doctor
  appointmentId: appointment._id,
  type: 'appointment',
  title: 'New Appointment Request',
  message: `A patient has booked an appointment for ${date} at ${time}`,
});
```

---

### P4-2: Load Chat History from DB

**Issues fixed:** F-09 (MEDIUM)

**Backend:** Add `GET /api/chat/history` route:

**File:** `backend/routes/chat.routes.js`
```js
router.get('/history', auth, getChatHistory);
```

**File:** `backend/controllers/chat.controller.js`
```js
exports.getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.user.id });
    res.json({ messages: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
};
```

**Frontend:** `AITools.jsx` — add useQuery for chat history:
```js
const { data: historyData } = useQuery({
  queryKey: ['chat-history'],
  queryFn: () => chatApi.get('/chat/history').then(res => res.data),
  onSuccess: (data) => setChatMessages(data.messages || []),
});
```

---

### P4-3: Add userId to Workout Model

**Issues fixed:** B-19, D-04 (MEDIUM)

**File:** `backend/models/workout.model.js`
```js
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
},
```

**File:** `backend/controllers/workout.controller.js`
```js
const workoutRecord = new Workout({
  userId: req.user.id,  // add this
  weight, height, goal, bmi, plan: parsed.plan,
});
```

---

### P4-4: Add Users Management Tab in Admin Dashboard

**Issues fixed:** F-12 (MEDIUM)

**File:** `frontend/src/pages/AdminDashboard.jsx`

Add a third tab `'users'` and fetch `GET /api/admin/users` to display a table with block/unblock functionality using `PUT /api/admin/users/:id { status: 'blocked' }`.

---

### P4-5: Add Global Error Handler to Express

**Issues fixed:** B-22 (MEDIUM)

**File:** `backend/server.js` — add before `app.listen`:

```js
// Global error handler (must be last middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});
```

---

## Phase 5: Code Quality / Low Priority

### P5-1: Remove Duplicate OpenAI Client Init in Workout Controller

**Issues fixed:** B-12 (LOW)

**File:** `backend/controllers/workout.controller.js`

Extract shared AI client into a utility module:
```js
// backend/utils/aiClient.js
const OpenAI = require('openai');
const getAIClient = () => { ... }
module.exports = getAIClient;
```
Then import in both `chat.controller.js` and `workout.controller.js`.

---

### P5-2: Fix Appointment Date Type

**Issues fixed:** D-01 (HIGH — affects date queries)

**File:** `backend/models/Appointment.js`

```js
// BEFORE
date: String,

// AFTER — if migrating existing data, convert strings to Date objects first
date: { type: Date },
```

⚠️ **This is a breaking change** — requires a data migration for any existing appointments. Update all controllers that compare dates.

---

### P5-3: Add Password Strength Validation

**Issues fixed:** SEC-14 (LOW)

**Files:** `auth.controller.js` (signup, doctorSignup)

```js
if (!password || password.length < 8) {
  return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
}
```

---

### P5-4: Add NoSQL Injection Protection

**Issues fixed:** SEC-11 (MEDIUM)

**Install:** `npm install express-mongo-sanitize`

**File:** `backend/server.js`
```js
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

---

### P5-5: Fix AdminLog Schema/Middleware Mismatch

**Issues fixed:** D-08 (LOW)

**File:** `backend/middleware/adminLog.middleware.js`

```js
const log = new AdminLog({
  adminId: req.user.id,
  action,
  targetId: req.params?.id || targetId,  // prefer dynamic from request
  ipAddress: req.ip,                      // top-level field per schema
  userAgent: req.get('User-Agent'),       // top-level field per schema
  details,
  success: true,
});
```

---

## Implementation Order Summary

| Phase | Priority | Items | Est. Time |
|-------|----------|-------|-----------|
| Phase 1: Runnable | CRITICAL | P1-1, P1-2 | 15 min |
| Phase 2: Security | CRITICAL/HIGH | P2-1 to P2-9 | 2-3 hours |
| Phase 3: Data Correctness | HIGH/MEDIUM | P3-1 to P3-11 | 3-4 hours |
| Phase 4: Feature Completion | MEDIUM | P4-1 to P4-5 | 4-5 hours |
| Phase 5: Code Quality | LOW | P5-1 to P5-5 | 2 hours |

**Total estimated effort: 12-15 hours of focused development**

---

## Verification Checklist (After Each Phase)

After Phase 1:
- [ ] `node server.js` starts without errors
- [ ] MongoDB connects
- [ ] `GET /` returns `AI Health Backend Running 🚀`

After Phase 2:
- [ ] Login error returns only `{ success: false, message: "Server error" }` — no stack trace
- [ ] `POST /api/doctors/add` without token returns 403
- [ ] `POST /api/medical/medical` without token returns 401
- [ ] CORS rejects requests from non-whitelisted origins
- [ ] File upload over 10MB returns an error
- [ ] Non-PDF/JPEG/PNG upload returns an error

After Phase 3:
- [ ] Registering with a phone number saves it correctly (`profile.mobile` populated)
- [ ] Navbar shows `firstName lastName` not "User"
- [ ] Profile page shows phone number
- [ ] Doctors search bar filters results
- [ ] Admin stats shows correct pending appointment count
- [ ] Booking appointment shows single toast, not stacked toasts

After Phase 4:
- [ ] Booking an appointment creates a notification for the doctor
- [ ] AI chat loads previous conversation on page open
- [ ] Workout plan is associated with user ID

After Phase 5:
- [ ] Server startup: no console errors about duplicate client inits
- [ ] Malicious `{ "$gt": "" }` in login email field is sanitized
