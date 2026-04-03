// backend/scripts/cleanupDatabase.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import DoctorSchedule from '../models/DoctorSchedule.js';

dotenv.config();

async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    console.log('✅ Connected to MongoDB');

    console.log('\n⚠️  WARNING: This will delete patient data, bookings, and messages!');
    console.log('✅ Doctors, Doctor Schedules/Availability, and Departments will be PRESERVED\n');

    // ============================================
    // DELETE ALL PATIENT-RELATED DATA
    // ============================================
    
    // Delete all patients
    const patientResult = await Patient.deleteMany({});
    console.log(`🗑️ Deleted ${patientResult.deletedCount} patients`);

    // Delete all bookings
    const bookingResult = await Booking.deleteMany({});
    console.log(`🗑️ Deleted ${bookingResult.deletedCount} bookings`);

    // Delete all conversations
    const conversationResult = await Conversation.deleteMany({});
    console.log(`🗑️ Deleted ${conversationResult.deletedCount} conversations`);

    // Delete all messages
    const messageResult = await Message.deleteMany({});
    console.log(`🗑️ Deleted ${messageResult.deletedCount} messages`);

    // Delete non-doctor, non-admin users (patients only)
    const userResult = await User.deleteMany({ 
      role: { $nin: ['doctor', 'admin'] } 
    });
    console.log(`🗑️ Deleted ${userResult.deletedCount} patients (kept doctors and admins)`);

    // ============================================
    // VERIFY PRESERVED DATA
    // ============================================
    
    // Count remaining doctors
    const doctorsCount = await User.countDocuments({ role: 'doctor' });
    console.log(`\n👨‍⚕️ Doctors preserved: ${doctorsCount}`);
    
    // Count doctor schedules
    const schedulesCount = await DoctorSchedule.countDocuments();
    console.log(`📅 Doctor schedules/availability preserved: ${schedulesCount}`);
    
    // Count departments
    const Department = (await import('../models/Department.js')).default;
    const departmentsCount = await Department.countDocuments();
    console.log(`🏥 Departments preserved: ${departmentsCount}`);

    // Optional: List all preserved doctors (uncomment if needed)
    // const doctors = await User.find({ role: 'doctor' }).select('name email');
    // console.log('\n📋 Preserved doctors:');
    // doctors.forEach(doc => {
    //   console.log(`   - Dr. ${doc.name} (${doc.email})`);
    // });

    console.log('\n🎉 Database cleanup complete!');
    console.log('\n📝 PRESERVED:');
    console.log('   ✅ Doctors (users with role="doctor")');
    console.log('   ✅ Doctor Schedules/Availability');
    console.log('   ✅ Departments');
    console.log('   ✅ Admin users');
    console.log('\n📝 DELETED:');
    console.log('   ❌ All patients');
    console.log('   ❌ All bookings/appointments');
    console.log('   ❌ All conversations');
    console.log('   ❌ All messages');
    console.log('   ❌ All patient users (role="patient")');
    
    console.log('\n📝 Next steps:');
    console.log('   1. Test signup as a new patient');
    console.log('   2. Book an appointment with a doctor');
    console.log('   3. Check messaging works');
    console.log('   4. Test doctor confirmation and completion');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

cleanupDatabase();