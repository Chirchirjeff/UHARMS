// backend/models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'singleton'
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    appointmentReminders: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    newUserRegistrations: { type: Boolean, default: true },
    dailyReports: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: true },
    monthlyReports: { type: Boolean, default: false }
  },
  system: {
    clinicName: { type: String, default: 'Uzima Healthcare' },
    clinicAddress: { type: String, default: '123 Healthcare Ave, Medical District' },
    clinicPhone: { type: String, default: '+254 700 000 000' },
    clinicEmail: { type: String, default: 'info@uzimahealthcare.com' },
    workingHoursStart: { type: String, default: '08:00' },
    workingHoursEnd: { type: String, default: '17:00' },
    maxAppointmentsPerDay: { type: Number, default: 50 },
    appointmentDuration: { type: Number, default: 30 },
    enableOnlineBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'daily' },
    retentionPeriod: { type: Number, default: 30 }
  },
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 },
    passwordExpiry: { type: Number, default: 90 },
    maxLoginAttempts: { type: Number, default: 5 },
    ipWhitelisting: { type: Boolean, default: false }
  },
  backupHistory: [{
    date: { type: Date, default: Date.now },
    fileUrl: String,
    size: Number,
    status: { type: String, default: 'success' }
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

// NO PRE-SAVE HOOKS - REMOVED COMPLETELY

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;