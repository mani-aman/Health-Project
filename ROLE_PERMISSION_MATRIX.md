# Role Permission Matrix

**System:** HealthAI Tracking System  
**Date:** 2026-11-06

---

## Roles

| Role | Description | Created By |
|------|-------------|-----------|
| `protected_admin` | Highest authority. One account. Full system access. | Server bootstrap (env vars only) |
| `super_admin` | Doctor & medical record management. No user deletion. | Protected Admin only |
| `doctor` | Clinical access to assigned patients. | Protected Admin or Super Admin |
| `user` | Personal health dashboard. | Public signup |

Legacy values `admin` (→ protected_admin) and `patient` (→ user) are preserved for DB backward compatibility.

---

## Permission Matrix

| Action | protected_admin | super_admin | doctor | user |
|--------|:-:|:-:|:-:|:-:|
| **Authentication** |
| Login (all roles) | ✅ | ✅ | ✅ | ✅ |
| Public signup | ❌ | ❌ | ❌ | ✅ |
| **User Management** |
| View all users | ✅ | ✅ (read-only) | ❌ | ❌ |
| Edit user profile | ✅ | ❌ | ❌ | ✅ (own) |
| Block/activate user | ✅ | ❌ | ❌ | ❌ |
| Delete user account | ✅ (soft) | ❌ | ❌ | ❌ |
| **Doctor Management** |
| Create doctor | ✅ | ✅ | ❌ | ❌ |
| Edit doctor | ✅ | ✅ | ❌ | ❌ |
| Delete doctor | ✅ | ✅ | ❌ | ❌ |
| Activate/deactivate doctor | ✅ | ✅ | ❌ | ❌ |
| View all doctors | ✅ | ✅ | ❌ | ✅ (active only) |
| **Super Admin Management** |
| Create super_admin | ✅ | ❌ | ❌ | ❌ |
| Edit super_admin | ✅ | ❌ | ❌ | ❌ |
| Delete super_admin | ✅ (soft) | ❌ | ❌ | ❌ |
| View super_admins | ✅ | ❌ | ❌ | ❌ |
| **Protected Admin Management** |
| Create protected_admin | ❌ (bootstrap only) | ❌ | ❌ | ❌ |
| Delete protected_admin | ❌ | ❌ | ❌ | ❌ |
| **Medical Records** |
| Upload own record | ❌ | ❌ | ❌ | ✅ |
| View own records | ❌ | ❌ | ❌ | ✅ |
| View all records (logged) | ✅ | ✅ | ❌ | ❌ |
| View patient records | ❌ | ❌ | ✅ (assigned) | ❌ |
| Upload for patient | ❌ | ❌ | ✅ | ❌ |
| **Appointments** |
| Book appointment | ❌ | ❌ | ❌ | ✅ |
| Cancel own appointment | ❌ | ❌ | ❌ | ✅ (own) |
| Confirm/reject/complete | ❌ | ❌ | ✅ | ❌ |
| View all appointments | ✅ | ✅ | ✅ (own) | ✅ (own) |
| **Prescriptions** |
| Create prescription | ❌ | ❌ | ✅ | ❌ |
| View own prescriptions | ❌ | ❌ | ✅ (own) | ✅ (own) |
| View patient prescriptions | ❌ | ❌ | ✅ | ❌ |
| **AI Tools** |
| Symptom checker | ❌ | ❌ | ❌ | ✅ |
| Workout generator | ❌ | ❌ | ❌ | ✅ |
| AI chat | ❌ | ❌ | ❌ | ✅ |
| **Audit Logs** |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| **Analytics** |
| View analytics | ✅ | ✅ | ❌ | ❌ |

---

## Security Rules

1. Role is always read from the **database**, never from the JWT payload alone.
2. Blocked/inactive accounts are rejected at the middleware level regardless of token validity.
3. The last active `protected_admin` cannot be blocked or deleted via the API.
4. `protected_admin` accounts cannot be created through any API endpoint.
5. Super Admin cannot elevate their own role.
6. Mass assignment is prevented — `role` is not in the allowed update fields for any user-facing route.
