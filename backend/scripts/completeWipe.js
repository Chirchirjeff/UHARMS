// backend/scripts/completeWipe.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function completeWipe() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    console.log('✅ Connected to MongoDB');

    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from ALL collections!');
    console.log('This includes: users, patients, doctors, bookings, conversations, messages, departments, schedules, admins, settings\n');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    let deletedCount = 0;
    
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      const result = await collection.deleteMany({});
      console.log(`🗑️ Deleted ${result.deletedCount} documents from ${collectionName}`);
      deletedCount += result.deletedCount;
    }

    console.log(`\n🎉 COMPLETE WIPE FINISHED!`);
    console.log(`📊 Total documents deleted: ${deletedCount}`);
    console.log(`🗑️ Collections wiped: ${collections.length}`);
    
    console.log('\n📝 What was deleted:');
    console.log('   ❌ All users (patients, doctors, admins)');
    console.log('   ❌ All patients');
    console.log('   ❌ All doctors');
    console.log('   ❌ All departments');
    console.log('   ❌ All bookings/appointments');
    console.log('   ❌ All conversations');
    console.log('   ❌ All messages');
    console.log('   ❌ All doctor schedules');
    console.log('   ❌ All settings');
    
    console.log('\n📝 Your database is now COMPLETELY EMPTY!');
    console.log('\nNext steps:');
    console.log('   1. Run department seeder (if you have one)');
    console.log('   2. Run doctor seeder: node scripts/seedDoctors.js');
    console.log('   3. Create admin: node scripts/createAdmin.js');
    console.log('   4. Start testing fresh!');

  } catch (error) {
    console.error('❌ Error during wipe:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

completeWipe();