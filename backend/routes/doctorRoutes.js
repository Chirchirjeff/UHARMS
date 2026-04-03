// backend/routes/doctorRoutes.js
import express from "express";
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Patient from "../models/Patient.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const router = express.Router();

// test
router.get("/test-debug", (req, res) => {
  res.json({ message: "Doctor routes are working", timestamp: new Date() });
});

// Get doctor profile by user ID
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    const doctor = await Doctor.findOne({ userId })
      .populate('departmentId', 'name');
    
    res.json({
      ...user.toObject(),
      doctorProfile: doctor
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get doctor dashboard stats
router.get("/:doctorId/stats", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`Fetching stats for doctor: ${doctorId}, today: ${todayStr}`);
    
    const todayAppointments = await Booking.countDocuments({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: todayStr,
      status: { $in: ['booked', 'confirmed'] }
    });
    
    const uniquePatients = await Booking.distinct('patientId', { 
      doctorId: new mongoose.Types.ObjectId(doctorId) 
    });
    const totalPatients = uniquePatients.length;
    
    const pendingAppointments = await Booking.countDocuments({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      status: 'booked'
    });
    
    const completedToday = await Booking.countDocuments({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: todayStr,
      status: 'completed'
    });
    
    res.json({
      todayAppointments,
      totalPatients,
      pendingAppointments,
      completedToday
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get doctor's appointments
router.get("/:doctorId/appointments", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { limit } = req.query;
    
    let query = Booking.find({ 
      doctorId: new mongoose.Types.ObjectId(doctorId) 
    }).sort({ date: 1, time: 1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const appointments = await query;
    console.log(`Found ${appointments.length} appointments for doctor ${doctorId}`);
    
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (apt) => {
        let patientData = {
          name: 'Unknown Patient',
          email: 'No email',
          phone: 'No phone'
        };
        
        if (apt.patientId) {
          const patient = await Patient.findById(apt.patientId);
          
          if (patient && patient.userId) {
            const user = await User.findById(patient.userId).select('name email phone');
            if (user) {
              patientData = {
                name: user.name,
                email: user.email || 'No email',
                phone: user.phone || 'No phone'
              };
            }
          }
        }
        
        return {
          _id: apt._id,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          createdAt: apt.createdAt,
          patientId: {
            _id: apt.patientId,
            ...patientData
          }
        };
      })
    );
    
    res.json(appointmentsWithPatients);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single patient details for doctor (MUST come before /:doctorId/patients)
router.get("/patients/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    const user = await User.findById(patient.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const appointments = await Booking.find({ patientId })
      .populate('doctorId')
      .sort({ date: -1 })
      .limit(5);
    
    res.json({
      _id: patient._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      emergencyContact: patient.emergencyContact,
      recentAppointments: appointments
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get doctor's patients
router.get("/:doctorId/patients", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const appointments = await Booking.find({ 
      doctorId: new mongoose.Types.ObjectId(doctorId) 
    }).sort({ date: -1 });
    
    const uniquePatientIds = [...new Set(appointments.map(apt => apt.patientId.toString()))];
    
    const patients = await Promise.all(
      uniquePatientIds.map(async (patientId) => {
        const patient = await Patient.findById(patientId);
        if (patient && patient.userId) {
          const user = await User.findById(patient.userId).select('name email phone');
          return {
            _id: patient._id,
            name: user?.name || 'Unknown',
            email: user?.email || '',
            phone: user?.phone || '',
            lastVisit: appointments.find(a => a.patientId.toString() === patientId)?.date,
            appointmentCount: appointments.filter(a => a.patientId.toString() === patientId).length
          };
        }
        return null;
      })
    );
    
    res.json(patients.filter(p => p !== null));
  } catch (error) {
    console.error("Error fetching doctor's patients:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create prescription and send as message - UPDATED with better handling
router.post("/prescriptions", async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, medicines, notes, doctorId } = req.body;
    
    if (!patientId || !diagnosis || !medicines || medicines.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get patient details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      return res.status(404).json({ error: "Patient user not found" });
    }
    
    // Get doctor ID - from request body or from appointment
    let doctorUserId = null;
    let doctorInfo = null;
    
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        doctorInfo = await User.findById(doctor.userId);
        doctorUserId = doctorInfo?._id;
      }
    } else if (appointmentId) {
      const appointment = await Booking.findById(appointmentId);
      if (appointment) {
        const doctor = await Doctor.findById(appointment.doctorId);
        if (doctor) {
          doctorInfo = await User.findById(doctor.userId);
          doctorUserId = doctorInfo?._id;
        }
      }
    }
    
    if (!doctorUserId) {
      return res.status(400).json({ error: "Doctor not identified" });
    }
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      "participants.userId": { $all: [doctorUserId, patientUser._id] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId: doctorUserId, role: "doctor" },
          { userId: patientUser._id, role: "patient" }
        ],
        appointmentId: appointmentId,
        lastMessage: "Prescription sent",
        lastMessageAt: new Date()
      });
      await conversation.save();
    }
    
    // Create prescription message
    const prescriptionText = `💊 **Prescription**\n\n📋 **Diagnosis:** ${diagnosis}\n\n💊 **Medicines:**\n${medicines.map(m => `• ${m.name} - ${m.dosage} (${m.duration})`).join('\n')}\n\n📝 **Notes:** ${notes || 'None'}`;
    
    const message = new Message({
      conversationId: conversation._id,
      senderId: doctorUserId,
      senderRole: "doctor",
      receiverId: patientUser._id,
      receiverRole: "patient",
      content: prescriptionText,
      messageType: "prescription",
      prescriptionData: { diagnosis, medicines, notes }
    });
    
    await message.save();
    
    // Update conversation
    conversation.lastMessage = prescriptionText;
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    res.status(201).json({ 
      message: "Prescription sent successfully",
      prescription: { diagnosis, medicines, notes }
    });
  } catch (error) {
    console.error("Error saving prescription:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update appointment status
router.patch("/appointments/:appointmentId/status", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["booked", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const appointment = await Booking.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    console.log(`✅ Appointment ${appointmentId} updated to ${status}`);
    
    res.json({ message: `Appointment ${status} successfully`, appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;