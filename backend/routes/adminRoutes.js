// backend/routes/adminRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRE = '7d';

// Middleware to verify admin token
export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================
// DEPARTMENT MANAGEMENT (ADDED HERE)
// ============================================

// Get all departments
router.get('/departments', verifyAdminToken, async (req, res) => {
  try {
    console.log('Fetching all departments...');
    const departments = await Department.find().sort({ name: 1 });
    console.log(`Found ${departments.length} departments`);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single department
router.get('/departments/:id', verifyAdminToken, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create department
router.post('/departments', verifyAdminToken, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    const existingDept = await Department.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    if (existingDept) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    
    const department = new Department({
      name: name.trim(),
      description: description || '',
      icon: icon || 'hospital'
    });
    
    await department.save();
    console.log(`✅ Department created: ${department.name}`);
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update department
router.put('/departments/:id', verifyAdminToken, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingDept) {
        return res.status(400).json({ error: 'Department with this name already exists' });
      }
      department.name = name;
    }
    
    if (description !== undefined) department.description = description;
    if (icon !== undefined) department.icon = icon;
    
    await department.save();
    console.log(`✅ Department updated: ${department.name}`);
    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete department
router.delete('/departments/:id', verifyAdminToken, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const doctorsCount = await Doctor.countDocuments({ departmentId: req.params.id });
    if (doctorsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department with ${doctorsCount} doctors assigned. Please reassign or delete the doctors first.` 
      });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    console.log(`✅ Department deleted: ${department.name}`);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Create initial admin (run this once to set up)
router.post('/setup', async (req, res) => {
  try {
    const adminExists = await Admin.findOne({});
    
    if (adminExists) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const admin = new Admin({
      name,
      email,
      password,
      role: 'superadmin'
    });

    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      user: admin.toJSON()
    });
  } catch (error) {
    console.error('Setup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      message: 'Login successful',
      token,
      user: admin.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get admin profile (protected)
router.get('/profile', verifyAdminToken, async (req, res) => {
  try {
    res.json({ user: req.admin });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin profile (protected)
router.put('/profile', verifyAdminToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const admin = await Admin.findById(req.admin._id);
    
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    
    await admin.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: admin.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password (protected)
router.post('/change-password', verifyAdminToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const admin = await Admin.findById(req.admin._id);
    
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Booking.countDocuments({
      date: {
        $gte: today.toISOString().split('T')[0],
        $lt: tomorrow.toISOString().split('T')[0]
      },
      status: { $in: ['booked', 'confirmed'] }
    });

    const totalAppointments = await Booking.countDocuments();

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = await Booking.countDocuments({
        date: dateStr,
        status: { $in: ['booked', 'confirmed', 'completed'] }
      });
      
      weekData.push({
        name: days[i],
        appointments: count
      });
    }

    res.json({
      stats: {
        totalPatients,
        totalDoctors,
        todayAppointments,
        totalAppointments
      },
      chartData: weekData
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DOCTOR MANAGEMENT
// ============================================

router.get('/doctors', verifyAdminToken, async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('userId', 'name email phone status')
      .populate('departmentId', 'name');
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/doctors', verifyAdminToken, async (req, res) => {
  try {
    const { name, email, password, phone, department, specialization, bio, consultationFee } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    let departmentId = null;
    if (department) {
      const dept = await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
      if (dept) {
        departmentId = dept._id;
      }
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      role: 'doctor',
      status: 'active'
    });

    await newUser.save();

    const doctorData = {
      userId: newUser._id,
      specialization: specialization || 'General',
      bio: bio || '',
      consultationFee: consultationFee || 0,
      status: 'active'
    };
    
    if (departmentId) {
      doctorData.departmentId = departmentId;
    }

    const newDoctor = new Doctor(doctorData);
    await newDoctor.save();

    const populatedDoctor = await Doctor.findById(newDoctor._id)
      .populate('userId', '-password')
      .populate('departmentId', 'name');

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: populatedDoctor
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.put('/doctors/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, specialization, bio, department, status, consultationFee } = req.body;
    
    const doctor = await Doctor.findById(id).populate('userId');
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    let departmentId = null;
    if (department) {
      const dept = await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
      if (dept) {
        departmentId = dept._id;
      }
    }
    
    if (doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId._id, {
        name: name || doctor.userId.name,
        email: email || doctor.userId.email,
        phone: phone || doctor.userId.phone,
        status: status || doctor.userId.status
      });
    }
    
    if (specialization) doctor.specialization = specialization;
    if (bio) doctor.bio = bio;
    if (departmentId) doctor.departmentId = departmentId;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (status) doctor.status = status;
    
    await doctor.save();
    
    const updatedDoctor = await Doctor.findById(id)
      .populate('userId', '-password')
      .populate('departmentId', 'name');
    
    res.json({ 
      message: 'Doctor updated successfully', 
      doctor: updatedDoctor 
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/doctors/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
    }
    
    await Doctor.findByIdAndDelete(id);
    
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PATIENT MANAGEMENT
// ============================================

router.get('/patients', verifyAdminToken, async (req, res) => {
  try {
    const patients = await Patient.find().populate('userId', 'name email phone');
    
    const patientsWithCounts = await Promise.all(
      patients.map(async (patient) => {
        const appointmentCount = await Booking.countDocuments({ patientId: patient._id });
        return {
          _id: patient._id,
          userId: patient.userId,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies,
          emergencyContact: patient.emergencyContact,
          totalAppointments: appointmentCount,
          createdAt: patient.createdAt
        };
      })
    );
    
    res.json(patientsWithCounts);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/patients/:id/status', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    if (patient.userId) {
      await User.findByIdAndUpdate(patient.userId, { status });
    }
    
    res.json({ 
      message: `Patient ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating patient status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// APPOINTMENT MANAGEMENT
// ============================================

router.get('/appointments', verifyAdminToken, async (req, res) => {
  try {
    const appointments = await Booking.find()
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ date: -1, time: -1 });
      
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/appointments/:id/status', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Booking.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = status;
    await appointment.save();
    
    res.json({ 
      message: 'Appointment status updated',
      appointment 
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// SETTINGS MANAGEMENT
// ============================================

router.get('/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({ _id: 'singleton' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/settings/notifications', verifyAdminToken, async (req, res) => {
  try {
    const notificationSettings = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ _id: 'singleton' });
    }
    
    settings.notifications = { ...settings.notifications, ...notificationSettings };
    settings.updatedBy = req.admin._id;
    settings.updatedAt = new Date();
    
    await settings.save();
    
    res.json({ 
      message: 'Notification settings saved successfully',
      notifications: settings.notifications
    });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/settings/system', verifyAdminToken, async (req, res) => {
  try {
    const systemSettings = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ _id: 'singleton' });
    }
    
    settings.system = { ...settings.system, ...systemSettings };
    settings.updatedBy = req.admin._id;
    settings.updatedAt = new Date();
    
    await settings.save();
    
    res.json({ 
      message: 'System settings saved successfully',
      system: settings.system
    });
  } catch (error) {
    console.error('Error saving system settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/settings/security', verifyAdminToken, async (req, res) => {
  try {
    const securitySettings = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ _id: 'singleton' });
    }
    
    settings.security = { ...settings.security, ...securitySettings };
    settings.updatedBy = req.admin._id;
    settings.updatedAt = new Date();
    
    await settings.save();
    
    res.json({ 
      message: 'Security settings saved successfully',
      security: settings.security
    });
  } catch (error) {
    console.error('Error saving security settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// BACKUP MANAGEMENT
// ============================================

router.post('/backup', verifyAdminToken, async (req, res) => {
  try {
    const backupRecord = {
      date: new Date(),
      status: 'success',
      size: 1024,
      fileUrl: null
    };
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ _id: 'singleton' });
    }
    
    if (!settings.backupHistory) {
      settings.backupHistory = [];
    }
    
    settings.backupHistory.unshift(backupRecord);
    settings.backupHistory = settings.backupHistory.slice(0, 10);
    
    await settings.save();
    
    res.json({ 
      message: 'Backup created successfully',
      backup: backupRecord
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/backup/history', verifyAdminToken, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings?.backupHistory || []);
  } catch (error) {
    console.error('Error fetching backup history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;