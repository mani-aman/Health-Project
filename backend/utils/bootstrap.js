/**
 * Bootstrap utility – provisions the single protected_admin account.
 *
 * Credentials are read exclusively from environment variables:
 *   PROTECTED_ADMIN_EMAIL
 *   PROTECTED_ADMIN_PASSWORD
 *   PROTECTED_ADMIN_FIRST_NAME  (optional, defaults to "Protected")
 *   PROTECTED_ADMIN_LAST_NAME   (optional, defaults to "Admin")
 *
 * This runs once on server start. If a protected_admin already exists,
 * it is a no-op. No HTTP endpoint exposes this logic.
 */

const bcrypt = require("bcryptjs");
const User = require("../models/auth.model");

const bootstrapProtectedAdmin = async () => {
  try {
    const email = process.env.PROTECTED_ADMIN_EMAIL;
    const password = process.env.PROTECTED_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn(
        "⚠️  PROTECTED_ADMIN_EMAIL or PROTECTED_ADMIN_PASSWORD not set in .env — " +
          "Protected Admin will NOT be bootstrapped. Set these variables to create the initial admin.",
      );
      return;
    }

    // Check if any protected_admin already exists (also check legacy 'admin')
    const existing = await User.findOne({
      role: { $in: ["protected_admin", "admin"] },
    });

    if (existing) {
      // If legacy 'admin' exists, upgrade its role silently
      if (existing.role === "admin") {
        existing.role = "protected_admin";
        await existing.save();
        console.log(
          `✅ Bootstrap: Upgraded legacy admin (${existing.email}) to protected_admin.`,
        );
      } else {
        console.log(
          `✅ Bootstrap: protected_admin already exists (${existing.email}). Skipping.`,
        );
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      firstName: process.env.PROTECTED_ADMIN_FIRST_NAME || "Protected",
      lastName: process.env.PROTECTED_ADMIN_LAST_NAME || "Admin",
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "protected_admin",
      status: "active",
    });

    console.log(
      `✅ Bootstrap: protected_admin account created for ${email}.`,
    );
  } catch (err) {
    console.error("❌ Bootstrap error:", err.message);
  }
};

module.exports = bootstrapProtectedAdmin;
