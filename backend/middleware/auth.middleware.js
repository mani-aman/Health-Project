const jwt = require("jsonwebtoken");
const User = require("../models/auth.model");

/**
 * authenticate – verifies JWT and attaches the LIVE DB user to req.user.
 *
 * We reload the user from the database on every request so that:
 *  - Blocked/deleted accounts are rejected even if they hold a valid token.
 *  - The role in req.user always comes from the DB, never from the JWT payload alone.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");
      return res
        .status(500)
        .json({ message: "Server misconfigured: JWT_SECRET missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    // Reload user from DB — this is the source of truth for role and status
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    if (user.status === "blocked" || user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Account is disabled. Contact support." });
    }

    req.user = user; // full DB document, role from DB
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(500).json({ message: "Server error during authentication" });
  }
};

/**
 * authorizeRoles(...roles) – role guard middleware factory.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorizeRoles('protected_admin'), handler)
 *   router.get('/admins',     authenticate, authorizeRoles('protected_admin','super_admin'), handler)
 *
 * Maps legacy roles transparently:
 *   'admin'   → treated as 'protected_admin'
 *   'patient' → treated as 'user'
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Normalize legacy roles for comparison
    const effectiveRole = normalizeRole(req.user.role);
    const normalizedAllowed = roles.map(normalizeRole);

    if (!normalizedAllowed.includes(effectiveRole)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

/** Maps legacy role names to the new RBAC values. */
const normalizeRole = (role) => {
  if (role === "admin") return "protected_admin";
  if (role === "patient") return "user";
  return role;
};

// ─── Convenience shorthands kept for backward compatibility ──────────────────

/** Any authenticated user */
const auth = authenticate;

/** protected_admin or super_admin */
const adminAuth = [
  authenticate,
  authorizeRoles("protected_admin", "super_admin", "admin"),
];

/** protected_admin only */
const protectedAdminAuth = [
  authenticate,
  authorizeRoles("protected_admin", "admin"),
];

/** super_admin only */
const superAdminAuth = [
  authenticate,
  authorizeRoles("super_admin"),
];

/** doctor only */
const doctorAuth = [authenticate, authorizeRoles("doctor")];

/** user (patient) only */
const userAuth = [authenticate, authorizeRoles("user", "patient")];

module.exports = {
  authenticate,
  authorizeRoles,
  normalizeRole,
  // shorthands
  auth,
  adminAuth,
  protectedAdminAuth,
  superAdminAuth,
  doctorAuth,
  userAuth,
};
