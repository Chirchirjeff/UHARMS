// controllers/patientController.js
import Patient from "../models/Patient.js";
import bcrypt from "bcrypt";

/**
 * Register a new patient
 */
export const registerPatient = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // -------- VALIDATION --------
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Phone validation (numbers only)
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Phone must contain numbers only" });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if patient already exists (by email or phone)
    const existing = await Patient.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ error: "Email or phone already registered" });
    }

    // -------- HASH PASSWORD --------
    const hashedPassword = await bcrypt.hash(password, 10);

    // -------- CREATE PATIENT --------
    const patient = new Patient({
      name,
      email,
      phone,
      password: hashedPassword
    });

    await patient.save();

    res.status(201).json({
      message: "Patient registered successfully",
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

/**
 * Login existing patient
 */
export const loginPatient = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: "Please provide email/phone and password" });
    }

    // Find patient by email OR phone
    const patient = await Patient.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!patient) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Success: return patient info
    res.json({
      message: "Login successful",
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during login" });
  }
};