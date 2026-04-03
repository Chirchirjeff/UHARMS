// backend/routes/availabilityRoutes.js
import express from "express";
import mongoose from "mongoose";
import DoctorSchedule from "../models/DoctorSchedule.js";
import Doctor from "../models/Doctor.js";

const router = express.Router();

// Get availability for a doctor
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = { doctorId: new mongoose.Types.ObjectId(doctorId) };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const schedules = await DoctorSchedule.find(query).sort({ date: 1 });
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get availability for a specific date
router.get("/doctor/:doctorId/date/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    const schedule = await DoctorSchedule.findOne({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date
    });
    
    if (!schedule) {
      // Return default availability structure
      return res.json({
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00",
        slots: []
      });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get available slots for a specific date
router.get("/doctor/:doctorId/date/:date/slots", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    const availableSlots = await DoctorSchedule.getAvailableSlots(doctorId, date);
    res.json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create or update doctor schedule
router.post("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { 
      date, 
      startTime, 
      endTime, 
      slotInterval, 
      isAvailable,
      breakStart,
      breakEnd,
      notes 
    } = req.body;
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    // Get or create schedule
    let schedule = await DoctorSchedule.findOne({ 
      doctorId: new mongoose.Types.ObjectId(doctorId), 
      date 
    });
    
    if (schedule) {
      // Update existing schedule
      if (startTime) schedule.startTime = startTime;
      if (endTime) schedule.endTime = endTime;
      if (slotInterval) schedule.slotInterval = slotInterval;
      if (isAvailable !== undefined) schedule.isAvailable = isAvailable;
      if (breakStart) schedule.breakTime.start = breakStart;
      if (breakEnd) schedule.breakTime.end = breakEnd;
      if (notes) schedule.notes = notes;
      
      // Regenerate slots based on new settings
      schedule.slots = schedule.generateTimeSlots();
    } else {
      // Create new schedule
      schedule = new DoctorSchedule({
        doctorId,
        date,
        startTime: startTime || "09:00",
        endTime: endTime || "17:00",
        slotInterval: slotInterval || 30,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        notes: notes || ""
      });
      
      if (breakStart) schedule.breakTime.start = breakStart;
      if (breakEnd) schedule.breakTime.end = breakEnd;
      
      schedule.slots = schedule.generateTimeSlots();
    }
    
    await schedule.save();
    
    res.json({ 
      message: "Schedule saved successfully", 
      schedule 
    });
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle availability for a specific date (mark as unavailable)
router.patch("/doctor/:doctorId/date/:date/toggle", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const { isAvailable } = req.body;
    
    let schedule = await DoctorSchedule.findOne({ 
      doctorId: new mongoose.Types.ObjectId(doctorId), 
      date 
    });
    
    if (!schedule) {
      schedule = new DoctorSchedule({
        doctorId,
        date,
        isAvailable
      });
      schedule.slots = schedule.generateTimeSlots();
    } else {
      schedule.isAvailable = isAvailable;
    }
    
    await schedule.save();
    
    res.json({ 
      message: `Availability set to ${isAvailable ? 'available' : 'unavailable'}`,
      schedule 
    });
  } catch (error) {
    console.error("Error toggling availability:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete schedule for a date
router.delete("/doctor/:doctorId/date/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    await DoctorSchedule.findOneAndDelete({ 
      doctorId: new mongoose.Types.ObjectId(doctorId), 
      date 
    });
    
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get weekly schedule template (recurring)
router.get("/doctor/:doctorId/template", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { dayOfWeek } = req.query;
    
    const query = { doctorId: new mongoose.Types.ObjectId(doctorId) };
    if (dayOfWeek) {
      query.dayOfWeek = dayOfWeek;
    }
    
    const templates = await DoctorSchedule.find(query).sort({ dayOfWeek: 1 });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching schedule templates:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;