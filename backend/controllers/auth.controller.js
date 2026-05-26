const User = require("../models/auth.model");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// 🔹 Signup
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    // ✅ validation
    if (!firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // ✅ check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      role: "patient",
    });

    // ✅ Improved Gmail transporter (App Password ready)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "⚠️ EMAIL_USER or EMAIL_PASS missing in .env - Emails disabled",
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // ✅ send email (wrapped in try-catch so signup fail na ho)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"Health AI" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "✅ Signup Successful - Welcome to Health AI!",
          html: `
            <h2>Hello ${firstName}!</h2>
            <p>Your account has been created successfully 🎉</p>
            <p>Thanks,<br>Health AI Team</p>
            <hr>
            <small>This is an automated message.</small>
          `,
        });
        console.log("✅ Welcome email sent to:", email);
      }
    } catch (emailError) {
      console.error(
        "❌ Email failed for",
        email,
        ":",
        emailError.response || emailError.message,
      );
    }

    // ✅ create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 Doctor Signup
exports.doctorSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      specialization,
      experience,
      fees,
      availability,
    } = req.body;

    // ✅ validation
    if (!firstName || !email || !password || !specialization) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // ✅ check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ create user with doctor role
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      role: "doctor",
      specialization,
      experience: Number(experience) || 0,
    });

    // ✅ create doctor profile
    console.log("🚀 Creating doctor profile for user:", user._id);
    const doctorProfile = await Doctor.create({
      userId: user._id,
      name: `${firstName} ${lastName || ""}`.trim(),
      specialization,
      experience: Number(experience) || 0,
      fees: Number(fees) || 0,
      availability: availability || {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
      },
      status: "active",
    });
    console.log(
      "✅ DOCTOR CREATED:",
      doctorProfile._id,
      doctorProfile.name,
      "- Active status",
    );

    // ✅ Improved Gmail transporter (App Password ready)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "⚠️ EMAIL_USER or EMAIL_PASS missing in .env - Emails disabled",
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // ✅ send welcome email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"Health AI" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "✅ Doctor Registration Successful - Welcome to Health AI!",
          html: `
            <h2>Hello Dr. ${firstName}!</h2>
            <p>Your doctor account has been created successfully 🎉</p>
            <p><strong>Specialization:</strong> ${specialization}</p>
            <p>You can now log in to the Doctor Portal to manage appointments and patients.</p>
            <p>Thanks,<br>Health AI Team</p>
            <hr>
            <small>This is an automated message.</small>
          `,
        });
        console.log("✅ Doctor welcome email sent to:", email);
      }
    } catch (emailError) {
      console.error(
        "❌ Email failed for",
        email,
        ":",
        emailError.response || emailError.message,
      );
    }

    // ✅ create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      message: "Doctor signup successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      doctorProfile,
    });
  } catch (err) {
    console.error("Doctor Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // ✅ find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }

    // ✅ compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // ✅ create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ✅ send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
