// backend/routes/bookingRoutes.js
import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";

const router = express.Router();

/* ---------------- Create Booking ---------------- */
router.post("/", async (req, res) => {
  try {
    const { doctorId, patientId, date, time } = req.body;

    console.log("📅 Creating booking:", { doctorId, patientId, date, time });

    // Check for existing booking
    const existingBooking = await Booking.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["booked", "confirmed"] }
    });

    if (existingBooking) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    // Create the booking
    const booking = new Booking({
      doctorId,
      patientId,
      date,
      time,
      status: "booked"
    });

    await booking.save();
    console.log("✅ Booking created:", booking._id);

    // ============================================
    // Create or get conversation between doctor and patient
    // ============================================
    
    // Get the doctor's user ID from the Doctor document
    const doctor = await Doctor.findById(doctorId);
    const patient = await Patient.findById(patientId);
    
    if (!doctor) {
      console.log("❌ Doctor not found:", doctorId);
    }
    if (!patient) {
      console.log("❌ Patient not found:", patientId);
    }
    
    if (doctor && patient) {
      // Get the actual User IDs
      const doctorUser = await User.findById(doctor.userId);
      const patientUser = await User.findById(patient.userId);
      
      if (doctorUser && patientUser) {
        console.log("👨‍⚕️ Doctor User ID:", doctorUser._id);
        console.log("👤 Patient User ID:", patientUser._id);
        
        // Check if conversation already exists using User IDs
        let conversation = await Conversation.findOne({
          "participants.userId": { $all: [doctorUser._id, patientUser._id] }
        });
        
        if (!conversation) {
          // Create new conversation
          conversation = new Conversation({
            participants: [
              { userId: doctorUser._id, role: "doctor" },
              { userId: patientUser._id, role: "patient" }
            ],
            appointmentId: booking._id,
            lastMessage: "Appointment booked",
            lastMessageAt: new Date()
          });
          
          await conversation.save();
          console.log("✅ Conversation created:", conversation._id);
        } else {
          console.log("✅ Conversation already exists:", conversation._id);
          // Update existing conversation with new appointment
          conversation.lastMessage = "New appointment booked";
          conversation.lastMessageAt = new Date();
          await conversation.save();
        }
      } else {
        console.log("❌ Could not find User records for doctor or patient");
      }
    }

    res.status(201).json({
      message: "Booking successful",
      booking
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- Get Booking by ID ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('doctorId')
      .populate('patientId');
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- Update Appointment Status ---------------- */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ["booked", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    console.log(`✅ Appointment ${id} updated to status: ${status}`);
    
    // Update conversation based on status change
    let message = "";
    if (status === "confirmed") {
      message = "Appointment confirmed";
    } else if (status === "cancelled") {
      message = "Appointment cancelled";
    } else if (status === "completed") {
      message = "Appointment completed";
    }
    
    if (message) {
      await Conversation.findOneAndUpdate(
        { appointmentId: id },
        { lastMessage: message, lastMessageAt: new Date() }
      );
    }
    
    res.json({
      message: `Appointment ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- Cancel Booking ---------------- */
router.patch("/:id/cancel", async (req, res) => {
  try {
    const bookingId = new mongoose.Types.ObjectId(req.params.id);

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found"
      });
    }

    booking.status = "cancelled";
    await booking.save();
    
    // Update conversation
    await Conversation.findOneAndUpdate(
      { appointmentId: bookingId },
      { lastMessage: "Appointment cancelled", lastMessageAt: new Date() }
    );

    res.json({
      message: "Booking cancelled successfully",
      booking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;