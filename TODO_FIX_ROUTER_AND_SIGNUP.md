# Fix Plan: React Router Warnings + Doctor Signup 404

## Issues Identified

### 1. React Router Future Flag Warnings

- **Cause**: `BrowserRouter` in `App.jsx` needs `future` prop flags for v7 compatibility
- **Fix**: Add `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` to `<Router>`

### 2. 404 on `/api/auth/doctor-signup`

- **Backend Analysis**: `auth.routes.js` correctly defines `POST /doctor-signup`, mounted at `/api/auth` in `server.js` → path `/api/auth/doctor-signup` exists
- **Frontend Analysis**: `DoctorRegister.jsx` calls `api.post('/auth/doctor-signup', ...)` with `baseURL: "/api"` → request goes to `/api/auth/doctor-signup`
- **Root Cause**: The backend server likely needs a restart to pick up route changes, OR there's a port mismatch (error shows `:3001` which is not the configured backend port `5000`)

## Implementation Steps

- [x] **frontend/src/App.jsx** — Add React Router `future` prop to eliminate warnings
- [x] **frontend/vite.config.js** — Strengthen proxy config (`secure: false`, `ws: true`)
- [x] **backend/server.js** — Add request logger middleware for debugging
- [x] **frontend/src/services/api.js** — Add response interceptor to log 404 errors with full URL
- [x] **frontend/src/pages/DoctorRegister.jsx** — Fix early-return loading state bug

## Follow-up After Edits (REQUIRED)

1. **Restart the backend server** (`cd backend && npm run dev` or `node server.js`) — this is critical because Node.js must reload to pick up the current `auth.routes.js`
2. **Hard-refresh browser** (Ctrl+F5)
3. **Retry doctor signup** — now the backend console will print every incoming request so you can verify the route is being hit
