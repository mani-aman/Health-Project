# Doctor Visibility in Patient Portal - Debug & Fix Steps

## Status: 🔄 In Progress

### Step 1: Start Servers ✅

```
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

**Expected logs:**

```
MongoDB Connected! 🎉
Server running on port 5000
```

### Step 2: Test Registration

1. Go to `http://localhost:3000/doctor/register`
2. Fill form, submit
3. Check **Backend terminal** for logs like `✅ DOCTOR CREATED: Dr. Test`
4. Check **Browser Network tab**: POST /api/auth/doctor-signup → 201 OK

### Step 3: Test Doctors List

1. Login as patient: `http://localhost:3000/login` → /dashboard or /doctors
2. Check **Backend terminal**: `📋 GET /doctors - Found X active`
3. Browser Network: GET /api/doctors → see new doctor in response

### Step 4: Debug Commands

```bash
# Check DB doctors (MongoDB Compass or shell)
db.doctors.find({status: "active"})

# Backend test with curl/Postman
curl -X POST http://localhost:5000/api/auth/doctor-signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Test", "lastName": "Doctor", "email": "test@doctor.com",
    "password": "123456", "specialization": "General", "experience": 5, "fees": 500
  }'

curl http://localhost:5000/api/doctors
```

### Common Issues & Fixes

1. **Backend 404**: Run `npm start` in backend/
2. **Mongo Error**: Check .env MONGO_URI
3. **CORS**: Proxy working ✓
4. **Empty list**: Clear browser cache, hard refresh (Ctrl+F5)

### Step 5: Verify Complete

- [ ] Doctor registers successfully
- [ ] Appears immediately in /doctors & Dashboard
- [ ] Can book appointment

**Next:** Update this file as steps complete.
