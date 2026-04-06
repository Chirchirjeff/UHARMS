// backend/scripts/generateDoctorSchedule.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DoctorSchedule from '../models/DoctorSchedule.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Configuration
const GENERATION_DAYS = 30;
const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '17:00';
const DEFAULT_SLOT_INTERVAL = 30;
const DEFAULT_BREAK_START = '13:00';
const DEFAULT_BREAK_END = '14:00';
const WEEKEND_DAYS = [0, 6];

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(date);
  return days[d.getDay()];
};

const isWorkingDay = (date, workingDays = null) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  if (workingDays && workingDays.length > 0) {
    return workingDays.includes(dayOfWeek);
  }
  return !WEEKEND_DAYS.includes(dayOfWeek);
};

const getDoctorScheduleSettings = (doctorEmail) => {
  return {
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    slotInterval: DEFAULT_SLOT_INTERVAL,
    breakStart: DEFAULT_BREAK_START,
    breakEnd: DEFAULT_BREAK_END,
    isAvailable: true,
  };
};

const overrideScheduleForDate = async (doctorId, date, settings) => {
  try {
    const dateStr = formatDate(date);
    
    // Delete existing schedule
    await DoctorSchedule.deleteOne({
      doctorId: doctorId,
      date: dateStr,
    });
    
    const dayOfWeek = getDayOfWeek(date);
    
    const scheduleData = {
      doctorId: doctorId,
      date: dateStr,
      dayOfWeek: dayOfWeek,
      isAvailable: true,
      startTime: settings.startTime,
      endTime: settings.endTime,
      slotInterval: settings.slotInterval,
      breakTime: {
        start: settings.breakStart,
        end: settings.breakEnd,
      },
      notes: `Auto-generated schedule for ${dateStr}`,
    };
    
    const schedule = new DoctorSchedule(scheduleData);
    schedule.slots = schedule.generateTimeSlots();
    await schedule.save();
    
    return schedule;
  } catch (error) {
    console.error(`      ❌ Error for ${formatDate(date)}:`, error.message);
    return null;
  }
};

async function generateAllDoctorSchedules(days = GENERATION_DAYS) {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DOCTOR SCHEDULE GENERATION SCRIPT');
  console.log('='.repeat(70));
  
  try {
    // Use the MongoDB URI from .env
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file!');
      console.log('Please create a .env file with your MongoDB connection string');
      return;
    }
    
    console.log('📡 Connecting to MongoDB Atlas...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide password in logs
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Fetch all doctors
    const doctors = await Doctor.find().populate('userId', 'name email');
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in the database');
      console.log('💡 Run seedDoctors.js first to create doctor profiles');
      return;
    }
    
    console.log(`\n📊 Found ${doctors.length} doctors in the system`);
    
    // Date range - start from tomorrow
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    
    console.log(`\n📆 Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    console.log(`📆 Total days to generate: ${days}`);
    console.log(`⚠️  Starting from TOMORROW (${formatDate(startDate)})\n`);
    
    let totalGenerated = 0;
    let totalDoctorsWithSchedules = 0;
    
    // Process each doctor
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const doctorName = doctor.userId?.name || 'Unknown';
      const doctorEmail = doctor.userId?.email || doctor.email;
      
      console.log(`\n[${i + 1}/${doctors.length}] Processing: ${doctorName}`);
      console.log(`   Email: ${doctorEmail}`);
      
      const settings = getDoctorScheduleSettings(doctorEmail);
      console.log(`   Working Hours: ${settings.startTime} - ${settings.endTime}`);
      
      let doctorGenerated = 0;
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (isWorkingDay(currentDate, settings.workingDays)) {
          const schedule = await overrideScheduleForDate(doctor._id, currentDate, settings);
          if (schedule) {
            doctorGenerated++;
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      totalGenerated += doctorGenerated;
      if (doctorGenerated > 0) {
        totalDoctorsWithSchedules++;
      }
      
      console.log(`   ✅ Generated ${doctorGenerated} days of schedules`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SCHEDULE GENERATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📊 Overall Statistics:`);
    console.log(`   👨‍⚕️ Doctors processed: ${doctors.length}`);
    console.log(`   ✅ Doctors with schedules: ${totalDoctorsWithSchedules}`);
    console.log(`   📆 Total schedule days generated: ${totalGenerated}`);
    console.log(`   📅 Days per doctor: ${GENERATION_DAYS}`);
    
    if (totalGenerated > 0) {
      console.log('\n✅ Successfully generated doctor schedules in MongoDB Atlas!');
      console.log('\n💡 Next steps:');
      console.log(`   1. Doctors can now view their schedules in the mobile app`);
      console.log(`   2. Patients can book appointments based on these time slots`);
      
      // Show a sample schedule
      const sampleSchedule = await DoctorSchedule.findOne()
        .populate('doctorId', 'userId')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email' }
        });
      
      if (sampleSchedule) {
        const doctorName = sampleSchedule.doctorId?.userId?.name || 'Unknown';
        console.log(`\n📅 Sample Schedule (${doctorName} - ${sampleSchedule.date}):`);
        console.log(`   Working Hours: ${sampleSchedule.startTime} - ${sampleSchedule.endTime}`);
        console.log(`   Total Slots: ${sampleSchedule.slots.length}`);
        console.log(`   Example slots: ${sampleSchedule.slots.slice(0, 3).map(s => `${s.startTime}-${s.endTime}`).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let daysToGenerate = GENERATION_DAYS;

args.forEach(arg => {
  if (arg.startsWith('--days=')) {
    daysToGenerate = parseInt(arg.split('=')[1]);
  } else if (arg === '--help') {
    console.log(`
Usage: node generateDoctorSchedule.js [options]

Options:
  --days=<number>   Number of days to generate schedules for (default: 30)

Examples:
  node generateDoctorSchedule.js              # Generate for 30 days
  node generateDoctorSchedule.js --days=60    # Generate for 60 days
    `);
    process.exit(0);
  }
});

// Run the script
console.log('\n🚀 Starting Doctor Schedule Generation Script');
console.log(`📅 Generating schedules for ${daysToGenerate} days starting from TOMORROW`);
console.log(`🔄 Will override any existing schedules\n`);

generateAllDoctorSchedules(daysToGenerate);