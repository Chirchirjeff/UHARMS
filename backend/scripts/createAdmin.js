// backend/scripts/createAdmin.js
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    
    // Remove the deprecated options - they're not needed anymore
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    
    console.log('✅ MongoDB connected successfully');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@uharms.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email: admin@uharms.com');
      console.log('Admin details:', {
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      
      // Test login credentials
      const testPassword = 'admin123';
      const isMatch = await existingAdmin.comparePassword(testPassword);
      console.log('Password test (admin123):', isMatch ? '✅ Correct' : '❌ Incorrect');
      
      return;
    }

    // Create admin
    console.log('Creating new admin...');
    
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@uharms.com',
      password: 'admin123',
      role: 'superadmin',
      phone: '+254700000000'
    });

    await admin.save();
    
    console.log('\n✅ Admin created successfully!');
    console.log('📧 Email: admin@uharms.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    // Verify the admin was saved and password works
    const savedAdmin = await Admin.findOne({ email: 'admin@uharms.com' });
    const isMatch = await savedAdmin.comparePassword('admin123');
    console.log('Password verification:', isMatch ? '✅ Works!' : '❌ Failed!');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    
    if (error.code === 11000) {
      console.error('Duplicate key error - email already exists');
    } else if (error.name === 'ValidationError') {
      console.error('Validation Error:', error.message);
    } else if (error.name === 'MongoServerError') {
      console.error('MongoDB Server Error:', error.message);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
    }
    process.exit(0);
  }
};

createAdmin();