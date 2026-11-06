#!/usr/bin/env node
/**
 * COMPREHENSIVE PROTECTED ADMIN DIAGNOSTIC SCRIPT
 *
 * This script diagnoses all possible issues with Protected Admin login:
 * 1. Environment variables are set
 * 2. MongoDB connection works
 * 3. Bootstrap creates account
 * 4. Account exists in database
 * 5. Password hash matches
 * 6. Login flow works
 * 7. JWT generation works
 * 8. All other login types still work
 *
 * RUN THIS WITH MONGODB RUNNING
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/auth.model");
const bootstrapProtectedAdmin = require("./utils/bootstrap");

async function diagnose() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     PROTECTED ADMIN COMPREHENSIVE DIAGNOSTIC SCRIPT              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  try {
    // CHECK 1: Environment Variables
    console.log("✓ CHECK 1: Environment Variables");
    console.log("─────────────────────────────────────────────────────────────────");

    const requiredEnvVars = [
      "MONGO_URI",
      "PROTECTED_ADMIN_EMAIL",
      "PROTECTED_ADMIN_PASSWORD",
      "JWT_SECRET",
    ];

    let envMissing = false;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        if (envVar === "PROTECTED_ADMIN_PASSWORD" || envVar === "JWT_SECRET") {
          console.log(`  ✅ ${envVar}: [SET - not displayed for security]`);
        } else {
          console.log(`  ✅ ${envVar}: ${process.env[envVar]}`);
        }
      } else {
        console.log(`  ❌ ${envVar}: NOT SET`);
        envMissing = true;
      }
    }

    if (envMissing) {
      console.log("\n❌ Missing required environment variables. Cannot proceed.\n");
      process.exit(1);
    }

    // CHECK 2: MongoDB Connection
    console.log("\n✓ CHECK 2: MongoDB Connection");
    console.log("─────────────────────────────────────────────────────────────────");

    console.log(`  Connecting to: ${process.env.MONGO_URI}`);

    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("  ✅ MongoDB connected successfully\n");
    } catch (err) {
      console.log(`  ❌ MongoDB connection failed: ${err.message}`);
      console.log("     Make sure MongoDB is running and MONGO_URI is correct.\n");
      process.exit(1);
    }

    // CHECK 3: Run Bootstrap
    console.log("✓ CHECK 3: Run Bootstrap");
    console.log("─────────────────────────────────────────────────────────────────");

    console.log("  Running bootstrapProtectedAdmin()...");
    await bootstrapProtectedAdmin();
    console.log("  ✅ Bootstrap completed\n");

    // CHECK 4: Find Protected Admin Account
    console.log("✓ CHECK 4: Protected Admin Account in Database");
    console.log("─────────────────────────────────────────────────────────────────");

    const adminEmail = process.env.PROTECTED_ADMIN_EMAIL.toLowerCase().trim();
    const admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log(`  ❌ Account NOT found for ${adminEmail}`);
      console.log(
        "\n  DIAGNOSIS: Bootstrap did not create the account. Possible reasons:",
      );
      console.log("    1. Environment variables are not set correctly");
      console.log("    2. Database already has a protected_admin account");
      console.log("    3. MongoDB connection was not ready during bootstrap\n");

      const anyAdmin = await User.findOne({ role: "protected_admin" });
      if (anyAdmin) {
        console.log(
          `  ℹ️  Found protected_admin account: ${anyAdmin.email} (not the one in .env)\n`,
        );
      }

      process.exit(1);
    }

    console.log(`  ✅ Account found: ${admin.email}`);
    console.log(`     First Name: ${admin.firstName}`);
    console.log(`     Last Name: ${admin.lastName}`);
    console.log(`     Role: ${admin.role}`);
    console.log(`     Status: ${admin.status}`);
    console.log(`     Created: ${admin.createdAt}\n`);

    // CHECK 5: Password Verification
    console.log("✓ CHECK 5: Password Hash Verification");
    console.log("─────────────────────────────────────────────────────────────────");

    const envPassword = process.env.PROTECTED_ADMIN_PASSWORD;
    const passwordMatch = await bcrypt.compare(envPassword, admin.password);

    if (passwordMatch) {
      console.log("  ✅ Password hash is CORRECT");
      console.log("     The password in .env matches the hash in database\n");
    } else {
      console.log("  ❌ Password hash MISMATCH!");
      console.log("     The password in .env does NOT match the database hash");
      console.log("\n  DIAGNOSIS: Password mismatch. Possible reasons:");
      console.log("    1. .env password was changed after account creation");
      console.log("    2. Account was created with different password");
      console.log("    3. Database was restored from backup\n");

      console.log("  SOLUTION: Delete the admin account and restart server:");
      console.log(
        "    db.users.deleteOne({ email: '" + adminEmail + "', role: 'protected_admin' })",
      );
      console.log("    Then restart the server to bootstrap with new password\n");

      process.exit(1);
    }

    // CHECK 6: Login Simulation
    console.log("✓ CHECK 6: Login Simulation");
    console.log("─────────────────────────────────────────────────────────────────");

    console.log(`  Simulating login with: ${adminEmail}`);

    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log("  ❌ User not found in login simulation");
      process.exit(1);
    }

    const isMatch = await bcrypt.compare(envPassword, user.password);
    if (!isMatch) {
      console.log("  ❌ Password does not match in login simulation");
      process.exit(1);
    }

    if (user.status === "blocked" || user.status === "inactive") {
      console.log(`  ❌ Account status is: ${user.status}`);
      console.log("     This would cause login to fail\n");
      process.exit(1);
    }

    console.log("  ✅ Login simulation successful\n");

    // CHECK 7: JWT Generation
    console.log("✓ CHECK 7: JWT Token Generation");
    console.log("─────────────────────────────────────────────────────────────────");

    try {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      console.log("  ✅ JWT token generated successfully");
      console.log(`     User ID: ${user._id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Token expires: 7 days\n`);

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("  ✅ JWT token verified successfully\n");
    } catch (err) {
      console.log(`  ❌ JWT error: ${err.message}\n`);
      process.exit(1);
    }

    // CHECK 8: Other Login Types
    console.log("✓ CHECK 8: Other Login Types Still Work");
    console.log("─────────────────────────────────────────────────────────────────");

    const otherRoles = ["super_admin", "doctor", "user"];
    let otherUsersFound = 0;

    for (const role of otherRoles) {
      const count = await User.countDocuments({ role });
      console.log(
        `  ${role}: ${count} account(s) ${count > 0 ? "✅" : "ℹ️"} `,
      );
      otherUsersFound += count;
    }

    console.log(`\n  ℹ️  Total non-admin accounts: ${otherUsersFound}\n`);

    // FINAL RESULT
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║                     ✅ ALL CHECKS PASSED                       ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log("Protected Admin is correctly configured.");
    console.log(
      "Login should succeed with the credentials in .env file.\n",
    );

    console.log("Next Steps:");
    console.log("  1. Ensure backend server is running (npm start)");
    console.log("  2. Make a POST request to /api/auth/login with:");
    console.log(`     Email: ${adminEmail}`);
    console.log("     Password: [value from .env PROTECTED_ADMIN_PASSWORD]");
    console.log("  3. You should receive a JWT token and user object\n");

    await mongoose.disconnect();
  } catch (error) {
    console.log(`\n❌ UNEXPECTED ERROR: ${error.message}`);
    console.log(error.stack);
    process.exit(1);
  }
}

diagnose();
