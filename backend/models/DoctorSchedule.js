// backend/models/DoctorSchedule.js
import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient"
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  }
});

const scheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  dayOfWeek: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  slots: [timeSlotSchema],
  slotInterval: {
    type: Number,
    default: 30 // minutes between slots
  },
  startTime: {
    type: String,
    default: "09:00"
  },
  endTime: {
    type: String,
    default: "17:00"
  },
  breakTime: {
    start: { type: String, default: "13:00" },
    end: { type: String, default: "14:00" }
  },
  notes: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Create a compound index to ensure unique schedule per doctor per date
scheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });

// Method to generate time slots based on start/end time and interval
scheduleSchema.methods.generateTimeSlots = function() {
  const slots = [];
  const start = this.parseTime(this.startTime);
  const end = this.parseTime(this.endTime);
  const interval = this.slotInterval;
  
  for (let time = start; time < end; time += interval) {
    const startTime = this.formatTime(time);
    const endTime = this.formatTime(time + interval);
    
    // Check if this slot is within break time
    const breakStart = this.parseTime(this.breakTime.start);
    const breakEnd = this.parseTime(this.breakTime.end);
    const isBreakTime = time >= breakStart && time < breakEnd;
    
    if (!isBreakTime) {
      slots.push({
        startTime,
        endTime,
        isBooked: false
      });
    }
  }
  
  return slots;
};

// Helper to parse time string to minutes
scheduleSchema.methods.parseTime = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to format minutes to time string
scheduleSchema.methods.formatTime = function(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Method to check if a slot is available
scheduleSchema.methods.isSlotAvailable = function(startTime, endTime) {
  const slot = this.slots.find(s => s.startTime === startTime && s.endTime === endTime);
  return slot && !slot.isBooked;
};

// Method to book a slot
scheduleSchema.methods.bookSlot = async function(startTime, endTime, patientId, bookingId) {
  const slot = this.slots.find(s => s.startTime === startTime && s.endTime === endTime);
  if (!slot) {
    throw new Error('Slot not found');
  }
  if (slot.isBooked) {
    throw new Error('Slot already booked');
  }
  
  slot.isBooked = true;
  slot.bookedBy = patientId;
  slot.bookingId = bookingId;
  
  await this.save();
  return slot;
};

// Method to cancel a booking
scheduleSchema.methods.cancelSlot = function(startTime, endTime) {
  const slot = this.slots.find(s => s.startTime === startTime && s.endTime === endTime);
  if (slot) {
    slot.isBooked = false;
    slot.bookedBy = null;
    slot.bookingId = null;
  }
};

// Static method to get or create schedule for a doctor on a specific date
scheduleSchema.statics.getOrCreate = async function(doctorId, date, options = {}) {
  let schedule = await this.findOne({ doctorId, date });
  
  if (!schedule) {
    schedule = new this({
      doctorId,
      date,
      ...options
    });
    
    // Generate slots based on start/end times
    schedule.slots = schedule.generateTimeSlots();
    await schedule.save();
  }
  
  return schedule;
};

// Static method to get available slots for a doctor on a specific date
scheduleSchema.statics.getAvailableSlots = async function(doctorId, date) {
  const schedule = await this.findOne({ doctorId, date });
  
  if (!schedule || !schedule.isAvailable) {
    return [];
  }
  
  return schedule.slots.filter(slot => !slot.isBooked);
};

const DoctorSchedule = mongoose.model("DoctorSchedule", scheduleSchema);
export default DoctorSchedule;