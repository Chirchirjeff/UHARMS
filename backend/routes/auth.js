// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";

const router = express.Router();

/* ===============================
   LOGIN (Unified - works for both patients and doctors)
================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("Login attempt for:", email);

    // Find user in User collection
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found in users collection");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found:", user.email, "Role:", user.role);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    user.lastLogin = new Date();
    await user.save();

    // Get role-specific profile
    let roleData = {};
    let roleId = null;

    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id }).populate('departmentId', 'name');
      if (doctor) {
        roleId = doctor._id;
        roleData = {
          doctorId: doctor._id,
          specialization: doctor.specialization,
          bio: doctor.bio,
          consultationFee: doctor.consultationFee,
          departmentId: doctor.departmentId?._id,
          departmentName: doctor.departmentId?.name
        };
        console.log("Doctor found with ID:", doctor._id);
      } else {
        console.log("Doctor profile not found for user:", user._id);
      }
    } else if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        roleId = patient._id;
        roleData = {
          patientId: patient._id
        };
        console.log("Patient found with ID:", patient._id);
      } else {
        console.log("Patient profile not found for user:", user._id);
      }
    }

    // Generate JWT token with roleId
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        roleId: roleId
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...roleData
    };

    // Explicitly set doctorId or patientId based on role
    if (user.role === 'doctor' && roleId) {
      responseUser.doctorId = roleId;
      console.log("Setting doctorId in response:", roleId);
    }
    if (user.role === 'patient' && roleId) {
      responseUser.patientId = roleId;
      console.log("Setting patientId in response:", roleId);
    }

    console.log("Login successful for:", email, "Role:", user.role);
    console.log("Response user:", JSON.stringify(responseUser, null, 2));
    
    res.json({ user: responseUser, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   DOCTOR LOGIN (Specific endpoint)
================================ */
router.post("/doctor/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("Doctor login attempt for:", email);

    // Find user with doctor role
    const user = await User.findOne({ email, role: 'doctor' });

    if (!user) {
      console.log("Doctor not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    user.lastLogin = new Date();
    await user.save();

    // Get doctor profile
    const doctor = await Doctor.findOne({ userId: user._id }).populate('departmentId', 'name');
    
    if (!doctor) {
      console.log("Doctor profile not found");
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      doctorId: doctor._id,
      specialization: doctor.specialization,
      bio: doctor.bio,
      consultationFee: doctor.consultationFee,
      departmentId: doctor.departmentId?._id,
      departmentName: doctor.departmentId?.name
    };

    console.log("Doctor data:", doctorData);

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: 'doctor',
        doctorId: doctor._id
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({ user: doctorData, token });
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   PATIENT LOGIN (Specific endpoint)
================================ */
router.post("/patient/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("Patient login attempt for:", email);

    // Find user with patient role
    const user = await User.findOne({ email, role: 'patient' });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    user.lastLogin = new Date();
    await user.save();

    const patient = await Patient.findOne({ userId: user._id });

    const patientData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      patientId: patient?._id
    };

    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'patient', patientId: patient?._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({ user: patientData, token });
  } catch (error) {
    console.error("Patient login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   SIGNUP (PATIENT ONLY) - FIXED with better error handling
================================ */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log("Signup attempt for:", email);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create User (let the model's pre-save hook hash the password)
    const newUser = new User({
      name,
      email,
      password, // Don't hash here - let the model handle it
      phone,
      role: 'patient',
      status: 'active'
    });

    await newUser.save();
    console.log("User created:", newUser._id);

    // Create Patient profile - ONLY userId, no phone/email/name fields
    const newPatient = new Patient({
      userId: newUser._id
      // Do NOT include phone, email, or name here
    });

    await newPatient.save();
    console.log("Patient profile created:", newPatient._id);

    // Generate token
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email, 
        role: 'patient', 
        patientId: newPatient._id 
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        patientId: newPatient._id
      },
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already registered` });
    }
    
    res.status(500).json({ error: "Server error" });
  }
});

export default router;