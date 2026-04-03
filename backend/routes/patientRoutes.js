import express from "express";
import mongoose from "mongoose";
import User from '../models/User.js';
import Booking from "../models/Booking.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";

const router = express.Router();

/* ---------------- Patient Bookings ---------------- */

router.get("/:id/bookings", async (req, res) => {

  try {

    const patientId = new mongoose.Types.ObjectId(req.params.id);

    const bookings = await Booking.find({ patientId })
      .populate({
        path: "doctorId",
        select: "userId bio",
        populate: {
          path: "userId",
          select: "name email phone"
        }
      })
      .sort({ date: 1, time: 1 });

    res.json(bookings);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

});

/* ---------------- Patient Signup ---------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'patient',
      status: 'active'
    });

    await newUser.save();

    // Create patient profile with userId
    const newPatient = new Patient({
      userId: newUser._id  // Link to the user
    });

    await newPatient.save();

    res.status(201).json({
      message: "Patient registered successfully",
      patient: {
        id: newPatient._id,
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;