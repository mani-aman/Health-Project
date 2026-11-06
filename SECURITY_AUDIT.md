# HealthAI – Security Audit

**Audit Date:** 2026-11-05  
**Scope:** Backend, frontend, authentication, data handling, configuration

---

## Critical Security Issues

### SEC-01: No Environment Configuration (CRITICAL)

**File:** `backend/` (root)  
**Issue:** No `.env` file is present. The application requires `MONGO_URI`, `JWT_SECRET`, `PORT`, and optionally AI/email keys. Without them:
- `mongoose.connect(undefined)` → server crashes on startup
- `jwt.sign(payload, undefined)` → JWT tokens signed with `undefined` secret (invalid)
- The auth middleware checks for missing `JWT_SECRET` and returns 500, but this means all authenticated routes fail

**Risk:** Application cannot run in production. If a developer creates `.env` with a weak `JWT_SECRET`, all tokens are vulnerable.

**Fix:**
```
# Create backend/.env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/healthai
JWT_SECRET=<minimum-32-char-random-string>
PORT=5000
EMAIL_USER=
EMAIL_PASS=
OPENAI_API_KEY=
```
Also create `backend/.env.example` for documentation. Never commit `.env` to version control.

---

### SEC-02: Stack Trace Leaked in Login Error Response (CRITICAL)

**File:** `backend/controllers/auth.controller.js`, `login()` catch block (~line 168)  
**Issue:**
```js
return res.status(500).json({
  message: "Server error",
  error: err?.message,
  stack: err?.stack,   // ← EXPOSES FULL STACK TRACE
});
```
**Risk:** Exposes file paths, function names, library versions, and internal server details to any client. Makes exploitation dramatically easier (information disclosure).

**Fix:** Remove `error` and `stack` fields from all production error responses:
```js
return res.status(500).json({ success: false, message: "Server error" });
```

---

### SEC-03: Plaintext Password Returned in Admin Create Doctor API (CRITICAL)

**File:** `backend/controllers/admin.controller.js`, `createDoctor()` (~line 105)  
**Issue:**
```js
credentials: {
  email: user.email,
  password: password,  // ← PLAINTEXT PASSWORD IN HTTP RESPONSE
},
```
**Risk:** Password is exposed in the API response, server logs, browser devtools network tab, and any proxy/WAF that logs request bodies. Anyone with admin access to devtools or network logs can steal the password.

**Fix:** Remove the `credentials.password` from the response. Document the password separately (e.g., display it once in the UI only if needed, then clear it):
```js
// Do NOT include password in response
// If admin needs to share it, display it only once in a modal and never log it
```

---

### SEC-04: Unprotected Endpoint – Create Doctor (HIGH)

**File:** `backend/routes/doctor.routes.js`, line 9  
**Issue:**
```js
router.post("/add", addDoctor);  // No auth middleware
```
**Risk:** Anyone on the internet can add a doctor to the system without any credentials.

**Fix:**
```js
router.post("/add", adminAuth, addDoctor);
```
Or remove the `/add` legacy route entirely since `/api/admin/doctors` now handles doctor creation.

---

### SEC-05: Unprotected Medical History Endpoint (HIGH)

**File:** `backend/routes/medicalHistory.routes.js`  
**Issue:**
```js
router.post("/medical", saveMedicalHistory);  // No auth middleware
```
**Risk:** Any unauthenticated caller can create medical history records for any user by supplying an arbitrary `userId` in the body. No ownership verification.

**Fix:**
```js
router.post("/medical", auth, saveMedicalHistory);
// In controller: use req.user.id instead of req.body.userId
```

---

### SEC-06: CORS Accepts All Origins (HIGH)

**File:** `backend/server.js`, line 13  
**Issue:**
```js
app.use(cors());  // Accepts ANY origin
```
**Risk:** Any website can make authenticated cross-origin requests to this API using the user's stored credentials (CSRF-style attacks in certain scenarios). In production, API should only accept requests from the deployed frontend domain.

**Fix:**
```js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

---

### SEC-07: No Rate Limiting (HIGH)

**File:** `backend/server.js` / all route files  
**Issue:** No rate limiting on any endpoint. Login, signup, AI tools, and file upload endpoints are unrestricted.

**Risk:**
- Brute-force login attacks (try millions of passwords)
- Credential stuffing
- AI API cost abuse (unlimited requests exhaust API quota)
- Denial of service via large file uploads

**Fix:** Add `express-rate-limit`:
```js
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
app.use('/api/auth/login', loginLimiter);

const apiLimiter = rateLimit({ windowMs: 60*1000, max: 100 });
app.use('/api', apiLimiter);
```

---

### SEC-08: No File Type or Size Validation on Uploads (HIGH)

**File:** `backend/routes/user.routes.js`, `doctor.routes.js`  
**Issue:**
```js
const upload = multer({ dest: 'uploads/records/' });
// No fileFilter, no limits
```
**Risk:**
- Malicious files (PHP/JSX/EXE) uploaded to server — though they're not executed, they can be downloaded
- Large files (GB+) could exhaust disk space and crash the server
- SVG files with embedded scripts could be served and execute in browser

**Fix:**
```js
const upload = multer({
  dest: 'uploads/records/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
  },
});
```

---

### SEC-09: Unauthenticated Access to Uploaded Files (HIGH)

**File:** `backend/server.js`, line ~28  
**Issue:**
```js
app.use("/uploads", express.static("uploads"));
```
**Risk:** Any file in the `uploads/records/` directory is publicly accessible without authentication. Medical records are sensitive patient data (PHI). A patient's records can be accessed by anyone who knows or guesses the filename. Multer generates UUID-like filenames, but filenames are stored in MongoDB and could be exposed.

**Fix Options:**
1. Remove static serving; serve files via an authenticated endpoint:
```js
router.get('/records/:id/download', auth, async (req, res) => {
  const record = await MedicalRecord.findOne({ _id: req.params.id, userId: req.user.id });
  if (!record) return res.status(404).json({ msg: 'Not found' });
  res.sendFile(path.resolve(record.path));
});
```
2. Long-term: use cloud storage (S3) with signed URLs.

---

### SEC-10: JWT Expiry and No Refresh Token Mechanism (MEDIUM)

**Issue:** JWT tokens expire after 7 days. There is no refresh token mechanism. When a token expires, users are silently kicked out on the next `checkAuth` call with no user-facing error message.

**Risk:** Moderate — users lose session after 7 days without warning.

**Fix:** Add refresh token support or display a proper "session expired, please log in again" message.

---

### SEC-11: No Input Sanitization Against NoSQL Injection (MEDIUM)

**File:** Multiple controllers  
**Issue:** User-provided values are passed directly to Mongoose queries without sanitization:
```js
const user = await User.findOne({ email });  // email from req.body
```
**Risk:** Mongoose/Node.js is not vulnerable to traditional SQL injection, but `$where`, `$regex`, and operator injection are possible if object values aren't sanitized. Example: `email: { $gt: '' }` could match unexpected records.

**Fix:** Add `express-mongo-sanitize`:
```js
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

---

### SEC-12: Sensitive Information in Server Console Logs (MEDIUM)

**File:** `auth.controller.js`, `doctor.controller.js`  
**Issue:** Several `console.log` statements print user data, including emails and internal IDs, to server output:
```js
console.log("✅ Welcome email sent to:", email);
console.log("✅ DOCTOR CREATED:", doctorProfile._id, doctorProfile.name);
```
**Risk:** In production, console output may be captured in log aggregators, accessible to unauthorized parties, or logged in plaintext files.

**Fix:** Remove or replace with a proper logger that supports log levels and redaction (e.g., `winston`, `pino`). Never log email addresses or user identifiers at INFO level in production.

---

### SEC-13: Admin Role Verification in AdminLogin Not Enforced Server-Side (MEDIUM)

**File:** `frontend/src/pages/AdminLogin.jsx`  
**Issue:** After login, the frontend checks `data.user.role !== 'admin'` and only then shows an error. However, the backend login endpoint does not check or restrict login by role — a patient or doctor can authenticate successfully via the admin login page, and the frontend role check depends entirely on client-side code.

**Risk:** Low in practice since JWTs carry the role and the `adminAuth` middleware enforces it on every admin route. But the UX is misleading and relies on client-side role enforcement as first gate.

**Fix:** No critical fix needed but add a comment clarifying that the backend `adminAuth` middleware is the real enforcement layer.

---

### SEC-14: Password Strength Not Enforced (LOW)

**File:** All auth endpoints  
**Issue:** No minimum length, complexity, or entropy requirements on passwords.

**Fix:** Add backend validation (at minimum length >= 8 chars):
```js
if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
```

---

### SEC-15: Files Stored on Local Disk (MEDIUM)

**File:** `backend/routes/user.routes.js`, Multer config  
**Issue:** Uploaded medical records are stored on the server's local filesystem under `uploads/records/`. This does not scale (multi-server deployments fail), backups are manual, and the path is exposed in DB records.

**Fix:** Use cloud storage (AWS S3, Cloudinary) with server-side encryption for medical records.

---

## Security Issue Summary

| ID | Issue | Severity |
|----|-------|----------|
| SEC-01 | No .env / JWT_SECRET undefined | CRITICAL |
| SEC-02 | Stack trace in login error response | CRITICAL |
| SEC-03 | Plaintext password in createDoctor response | CRITICAL |
| SEC-04 | Unprotected POST /api/doctors/add | HIGH |
| SEC-05 | No auth on medical history endpoint | HIGH |
| SEC-06 | CORS allows all origins | HIGH |
| SEC-07 | No rate limiting | HIGH |
| SEC-08 | No file type or size validation | HIGH |
| SEC-09 | Uploaded files publicly accessible without auth | HIGH |
| SEC-10 | No token refresh mechanism | MEDIUM |
| SEC-11 | No NoSQL injection sanitization | MEDIUM |
| SEC-12 | PII in server console logs | MEDIUM |
| SEC-13 | Admin role check only client-side | MEDIUM |
| SEC-14 | No password strength enforcement | LOW |
| SEC-15 | Local disk file storage | MEDIUM |

---

## HIPAA / Patient Data Considerations

This application handles Protected Health Information (PHI):
- Medical records (file uploads)
- Prescriptions
- Symptom analysis results
- Health profile data (height, weight, BMI, allergies, chronic diseases)

Current compliance gaps:
1. **No audit trail** for who accessed patient data (other than AdminLog which is incomplete)
2. **No encryption at rest** for database or files
3. **No access control on medical records** beyond ownership check
4. **No data retention policy**
5. **No consent mechanism** documented

These are design-level concerns beyond code fixes. If this application is intended for real healthcare use, a legal/compliance review is required.
