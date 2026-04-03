import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    console.log('✅ Connected to MongoDB');

    // Find all doctors
    const doctors = await User.find({ role: 'doctor' });
    console.log(`Found ${doctors.length} doctors to update`);

    let updated = 0;

    for (const doctor of doctors) {
      // Generate a fresh hash for "doctor123" using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash('doctor123', salt);
      
      // Update the doctor's password
      const result = await User.updateOne(
        { _id: doctor._id },
        { $set: { password: newHash } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated: ${doctor.name} (${doctor.email})`);
        console.log(`   New hash: ${newHash.substring(0, 40)}...`);
        updated++;
      }
    }

    console.log(`\n🎉 Updated ${updated} doctor passwords`);
    console.log('All doctors can now login with password: doctor123');

  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

fixPasswords();