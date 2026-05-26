# Fix Plan: Other Functions Not Working (Except Doctor Appointment)

## Information Gathered

After thorough analysis of the frontend (`App.jsx`, `Dashboard.jsx`, `Profile.jsx`, `AITools.jsx`, `api.js`) and backend (`server.js`, routes, controllers, models), I identified **6 critical bugs** causing features to fail:

### Bug 1: AITools.jsx — Missing API Imports (CRITICAL)

- **File:** `frontend/src/pages/AITools.jsx`
- **Problem:** Uses `symptomApi`, `workoutApi`, `chatApi` but only imports `api`. These variables are `undefined`, causing `ReferenceError` on every button click.
- **Fix:** Import `symptomApi`, `workoutApi`, `chatApi` from `../services/api.js`.

### Bug 2: AITools.jsx — Workout Payload Missing Fields (CRITICAL)

- **File:** `frontend/src/pages/AITools.jsx`
- **Problem:** Sends `{ goal }` only, but backend `workout.controller.js` requires `weight`, `height`, AND `goal`.
- **Fix:** Read `weight` and `height` from the user's health profile (or add input fields) and include them in the request.

### Bug 3: Dashboard.jsx — "Mark All Read" Wrong Endpoint

- **File:** `frontend/src/pages/Dashboard.jsx`
- **Problem:** When `id === 'all'`, it calls `PATCH /notifications/all/read`. Backend route is `PATCH /notifications/read-all`.
- **Fix:** Add conditional logic: if `id === 'all'`, call `/notifications/read-all`, otherwise call `/notifications/${id}/read`.

### Bug 4: user.controller.js — Prescriptions Query Is Broken

- **File:** `backend/controllers/user.controller.js`
- **Problem:** `Prescription.find({ "appointmentId.userId": req.user.id })` fails because `appointmentId` is an ObjectId reference, not an embedded document. MongoDB cannot query nested fields through a reference. Always returns empty array.
- **Fix:** Query user's appointments first, then find prescriptions matching those `appointmentId`s.

### Bug 5: Profile.jsx — Error Handling Mismatch & Non-Functional Buttons

- **File:** `frontend/src/pages/Profile.jsx`
- **Problem A:** Error handler uses `err.response?.data?.msg`, but backend sometimes sends `message`.
- **Problem B:** "View Prescriptions", "Upload Record", "Calculate BMI" buttons have no `onClick` handlers.
- **Fix A:** Use `err.response?.data?.message || err.response?.data?.msg`.
- **Fix B:** Add navigation handlers (`useNavigate`) or placeholder toast messages.

### Bug 6: Dashboard.jsx — `window.location.href` Navigation

- **File:** `frontend/src/pages/Dashboard.jsx`
- **Problem:** Uses `window.location.href` for in-app navigation, causing full page reloads.
- **Fix:** Replace with React Router's `useNavigate`.

---

## Plan at File Level

| #   | File                                     | Changes                                                                                                                    |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | `frontend/src/pages/AITools.jsx`         | Import `symptomApi`, `workoutApi`, `chatApi`; add weight/height inputs/state for workout; fetch profile for default values |
| 2   | `frontend/src/pages/Dashboard.jsx`       | Fix mark-all-read endpoint; replace `window.location.href` with `useNavigate`                                              |
| 3   | `frontend/src/pages/Profile.jsx`         | Fix error message fallback; add button onClick handlers                                                                    |
| 4   | `backend/controllers/user.controller.js` | Fix `getMyPrescriptions` query to use `$in` with user's appointment IDs                                                    |
| 5   | `frontend/src/services/api.js`           | (Optional) Ensure exports are clean                                                                                        |

## Dependent Files

- `backend/models/Appointment.js` — referenced for prescription query fix
- `backend/models/Prescription.js` — schema confirms `appointmentId` is ObjectId ref

## Follow-up Steps

1. Test frontend after fixes (`cd frontend && npm run dev`)
2. Test backend endpoints with Postman or browser dev tools
3. Verify Dashboard loads prescriptions when appointments exist
4. Verify AI Tools symptom checker, workout generator, and chat all respond correctly
