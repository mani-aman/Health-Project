# Admin Dashboard Creation Plan

Status: In Progress

## Information Gathered

- Backend admin.routes.js and admin.controller.js exist with doctor CRUD (add/remove)
- Doctor model lacks status field - all doctors visible to patients immediately
- No frontend AdminDashboard.jsx or admin route
- ProtectedRoute.jsx supports allowedRoles=['admin']
- Dashboard.jsx shows React Query + Tailwind pattern

## Plan

[x] 1. Add status field to Doctor model (pending/active/blocked) 2. Update doctorSignup to set status='pending' 3. Update getDoctors to filter status='active' 4. Add admin approve/reject endpoints 5. Create frontend/src/pages/AdminDashboard.jsx 6. Add /admin route to App.jsx 7. Update Navbar.jsx for admin role 8. Test admin login/redirect flow

## Dependent Files

- backend/models/Doctor.js
- backend/controllers/doctor.controller.js
- backend/controllers/auth.controller.js
- frontend/src/App.jsx
- frontend/src/components/Navbar.jsx
- frontend/src/pages/AdminDashboard.jsx (new)
- frontend/src/services/api.js

## Followup Steps

1. Backend server restart
2. Test admin login
3. Test doctor management UI
4. Test patient dashboard shows only active doctors
5. npm run dev frontend restart

[x] Plan approved by user - Starting implementation
