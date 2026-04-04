import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

/*------------------- Frontend -------------------*/

// Create express app
const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:19006',
    'http://localhost:19000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/*-------------------- Health Check -------------------*/

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ---------------- MongoDB Connection ---------------- */

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connected to Atlas");

  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // Stop app if DB fails
  }
};

// Call DB connection
connectDB();

/*-------------------- Routes -------------------*/

// Import AFTER dotenv config
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patientRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

/* ---------------- Register Routes ---------------- */

// Authentication routes
app.use("/auth", authRoutes);

// Patient routes
app.use("/patients", patientRoutes);

// Department routes
app.use("/departments", departmentRoutes);

// Doctor routes
app.use("/doctors", doctorRoutes);

// Booking routes
app.use("/bookings", bookingRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Availability routes
app.use("/availability", availabilityRoutes);

// Message routes
app.use("/messages", messageRoutes);

/* ---------------- Debug Endpoints ---------------- */

app.get('/api/debug/doctors', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const Doctor = (await import('./models/Doctor.js')).default;
    
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    const doctorProfiles = await Doctor.find().populate('userId', 'name email');
    
    res.json({
      users: doctors,
      profiles: doctorProfiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- Server Start ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});