#!/usr/bin/env node
/**
 * Test script to verify:
 * 1. MongoDB connection works
 * 2. Protected Admin account exists
 * 3. Protected Admin password is correct
 * 4. Login flow would succeed with correct credentials
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/auth.model");

async function testProtectedAdmin() {
  console.log("\n🧪 PROTECTED ADMIN VERIFICATION TEST\n");

  try {
    // Step 1: Connect to MongoDB
    console.log("1️⃣  Connecting to MongoDB...");
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("   ❌ MONGO_URI not set in .env");
      process.exit(1);
    }

    console.log(`   Using: mongodb://localhost:27017/healthai`);

    await mongoose.connect(mongoUri);
    console.log("   ✅ MongoDB connected\n");

    // Step 2: Check for Protected Admin account
    console.log("2️⃣  Looking for Protected Admin account...");
    const adminEmail = process.env.PROTECTED_ADMIN_EMAIL;
    console.log(`   Email: ${adminEmail}`);

    const admin = await User.findOne({
      email: adminEmail.toLowerCase().trim(),
    });

    if (!admin) {
      console.log("   ❌ Protected Admin account NOT FOUND in database\n");
      console.log("   This explains the 'Invalid credentials' error.");
      console.log("   The account needs to be created during bootstrap.\n");

      // Check if bootstrap ran
      const anyAdmin = await User.findOne({ role: "protected_admin" });
      if (!anyAdmin) {
        console.log(
          "   ⚠️  No protected_admin accounts exist at all in the database.",
        );
        console.log("   Bootstrap did not create an account.\n");
      }

      process.exit(1);
    }

    console.log(`   ✅ Account found in database\n`);

    // Step 3: Display account details (no password)
    console.log("3️⃣  Account Details:");
    console.log(`   First Name: ${admin.firstName}`);
    console.log(`   Last Name: ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Created: ${admin.createdAt}\n`);

    // Step 4: Verify password hash
    console.log("4️⃣  Verifying password...");
    const envPassword = process.env.PROTECTED_ADMIN_PASSWORD;
    if (!envPassword) {
      console.error("   ❌ PROTECTED_ADMIN_PASSWORD not set in .env");
      process.exit(1);
    }

    const passwordMatch = await bcrypt.compare(envPassword, admin.password);
    if (passwordMatch) {
      console.log("   ✅ Password in database matches .env password\n");
    } else {
      console.log("   ❌ Password MISMATCH!\n");
      console.log("   Possible causes:");
      console.log("   • .env password was changed after account creation");
      console.log("   • Password in database is corrupted");
      console.log("   • Different bootstrap ran with different password\n");
      process.exit(1);
    }

    // Step 5: Simulate login
    console.log("5️⃣  Simulating login flow...");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: [correct password from .env]`);

    const user = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (!user) {
      console.log("   ❌ User not found during login simulation");
      process.exit(1);
    }

    const isMatch = await bcrypt.compare(envPassword, user.password);
    if (!isMatch) {
      console.log("   ❌ Password does not match");
      process.exit(1);
    }

    if (user.status === "blocked" || user.status === "inactive") {
      console.log("   ❌ Account is blocked or inactive");
      process.exit(1);
    }

    console.log("   ✅ Login simulation successful\n");

    console.log("6️⃣  JWT Token would be generated with:");
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);

    console.log("═════════════════════════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED");
    console.log("═════════════════════════════════════════════════════════\n");
    console.log("Protected Admin account is correctly configured.");
    console.log("Login should succeed with the credentials in .env.\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testProtectedAdmin();
