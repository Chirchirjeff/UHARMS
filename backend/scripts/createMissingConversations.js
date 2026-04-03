// backend/scripts/createMissingConversations.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

dotenv.config();

async function createMissingConversations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    console.log('✅ Connected to MongoDB');

    // Get all bookings
    const bookings = await Booking.find();
    console.log(`📊 Found ${bookings.length} bookings`);

    let created = 0;
    let skipped = 0;

    for (const booking of bookings) {
      console.log(`\n--- Processing booking ${booking._id} ---`);
      
      // Get doctor and patient
      const doctor = await Doctor.findById(booking.doctorId);
      const patient = await Patient.findById(booking.patientId);
      
      if (!doctor) {
        console.log(`❌ Doctor not found for booking ${booking._id}`);
        skipped++;
        continue;
      }
      
      if (!patient) {
        console.log(`❌ Patient not found for booking ${booking._id}`);
        skipped++;
        continue;
      }
      
      const doctorUser = await User.findById(doctor.userId);
      const patientUser = await User.findById(patient.userId);
      
      if (!doctorUser || !patientUser) {
        console.log(`❌ User records not found for booking ${booking._id}`);
        skipped++;
        continue;
      }
      
      console.log(`👨‍⚕️ Doctor: ${doctorUser.name} (${doctorUser._id})`);
      console.log(`👤 Patient: ${patientUser.name} (${patientUser._id})`);
      
      // Check if conversation exists
      let conversation = await Conversation.findOne({
        "participants.userId": { $all: [doctorUser._id, patientUser._id] }
      });
      
      if (conversation) {
        console.log(`✅ Conversation already exists: ${conversation._id}`);
        skipped++;
      } else {
        // Create conversation
        conversation = new Conversation({
          participants: [
            { userId: doctorUser._id, role: "doctor" },
            { userId: patientUser._id, role: "patient" }
          ],
          appointmentId: booking._id,
          lastMessage: "Appointment booked",
          lastMessageAt: booking.createdAt || new Date()
        });
        
        await conversation.save();
        console.log(`✅ Created conversation: ${conversation._id}`);
        created++;
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`📊 Created: ${created} conversations`);
    console.log(`⏭️ Skipped: ${skipped} (already existed or errors)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

createMissingConversations();