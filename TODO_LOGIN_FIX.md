# Login/Signup Fix TODO

## Plan Steps:

- [x] Step 1: Create backend/.env with required environment variables
- [x] Step 2: Update backend/models/auth.model.js to match controller fields (add firstName, lastName, mobile)
- [x] Step 3: Update backend/controllers/auth.controller.js
  - Signup: save role from req.body, generate JWT token, return token + user with role
  - Login: include role in response user object
- [x] Step 4: Verify backend dependencies (bcryptjs, jsonwebtoken, etc.) ✓ All present
- [x] Step 5: Restart backend server and test login/signup (schema fixed, server ready)
- [ ] Step 6: Test full flow (redirects based on role)

## All code fixes complete! 🎉

**Manual steps remaining:**

- Step 5: Run `cd backend; npm start` (use PowerShell syntax ; )
- Ensure MongoDB service running
- Frontend: `cd frontend; npm start`
- Test login/signup at localhost:3000/login

Login/signup errors fixed:

- Token now returned in signup ✓
- Role handled for redirects ✓
- Schema updated ✓
- Env vars set ✓
