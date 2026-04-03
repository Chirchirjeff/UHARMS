// controllers/bookingController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

/**
 * Create a new booking
 * Automatically creates a conversation between doctor and patient if it doesn't exist
 */
export const createBooking = async (req, res) => {
  try {
    const { doctorId, patientId, date, time } = req.body;

    // Check if slot already booked
    const existingBooking = await Booking.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["booked", "confirmed"] }
    });

    if (existingBooking) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    // Create new booking
    const booking = new Booking({ doctorId, patientId, date, time, status: "booked" });
    await booking.save();

    // Create or get conversation
    let conversation = await Conversation.findOne({
      "participants.userId": { $all: [doctorId, patientId] }
    });

    if (!conversation) {
      const doctor = await User.findById(doctorId);
      const patient = await User.findById(patientId);

      if (doctor && patient) {
        conversation = new Conversation({
          participants: [
            { userId: doctorId, role: "doctor" },
            { userId: patientId, role: "patient" }
          ],
          appointmentId: booking._id,
          lastMessage: "Appointment booked",
          lastMessageAt: new Date()
        });
        await conversation.save();

        // Link conversation to booking
        booking.conversationId = conversation._id;
        await booking.save();

        console.log(`✅ Conversation created between doctor ${doctorId} and patient ${patientId}`);
      }
    } else {
      // If conversation exists but booking not linked
      if (!booking.conversationId) {
        booking.conversationId = conversation._id;
        await booking.save();
      }
    }

    res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("doctorId", "name email phone")
      .populate("patientId", "name email phone")
      .populate("conversationId"); // populate conversation if needed

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["booked", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Update conversation's last message
    const messageMap = {
      booked: "Appointment booked",
      confirmed: "Appointment confirmed",
      cancelled: "Appointment cancelled",
      completed: "Appointment completed"
    };

    if (booking.conversationId) {
      await Conversation.findByIdAndUpdate(
        booking.conversationId,
        { lastMessage: messageMap[status], lastMessageAt: new Date() }
      );
    }

    res.json({ message: `Appointment ${status} successfully`, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};