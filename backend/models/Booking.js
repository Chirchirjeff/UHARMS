// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["booked", "confirmed", "cancelled", "completed"],
    default: "booked"
  },
  notes: {
    type: String,
    default: ""
  },
  // 🔥 New field to link conversation
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    default: null
  }
}, {
  timestamps: true  // createdAt and updatedAt automatically
});

// Indexes for faster queries
bookingSchema.index({ doctorId: 1, date: 1 });
bookingSchema.index({ patientId: 1, date: 1 });
bookingSchema.index({ conversationId: 1 }); // 🔥 For quick conversation lookup

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;