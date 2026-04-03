// backend/routes/departmentRoutes.js
import express from "express";
import mongoose from "mongoose";
import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import { verifyAdminToken } from "./adminRoutes.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get all departments (public - for patients to view)
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    console.log(`Found ${departments.length} departments`);
    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single department by ID
router.get("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json(department);
  } catch (err) {
    console.error("Error fetching department:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get doctors in a department (public - for patients)
router.get("/:id/doctors", async (req, res) => {
  try {
    const departmentId = new mongoose.Types.ObjectId(req.params.id);

    const doctors = await Doctor.find({ departmentId, status: 'active' })
      .populate('userId', 'name email phone')
      .select('-__v');

    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      name: doctor.userId?.name || 'Unknown Doctor',
      email: doctor.userId?.email || '',
      phone: doctor.userId?.phone || '',
      specialization: doctor.specialization || 'General',
      bio: doctor.bio || '',
      departmentId: doctor.departmentId,
      consultationFee: doctor.consultationFee,
      status: doctor.status
    }));

    res.json(formattedDoctors);
  } catch (err) {
    console.error("Error fetching doctors by department:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// ADMIN ROUTES (Requires authentication)
// ============================================

// Create a new department (admin only)
router.post("/", verifyAdminToken, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Department name is required" });
    }
    
    // Check if department already exists
    const existingDept = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingDept) {
      return res.status(400).json({ error: "Department with this name already exists" });
    }
    
    const department = new Department({
      name: name.trim(),
      description: description || "",
      icon: icon || "hospital"
    });
    
    await department.save();
    console.log(`✅ Department created: ${department.name}`);
    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a department (admin only)
router.put("/:id", verifyAdminToken, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    // Check for duplicate name (excluding current department)
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingDept) {
        return res.status(400).json({ error: "Department with this name already exists" });
      }
      department.name = name;
    }
    
    if (description !== undefined) department.description = description;
    if (icon !== undefined) department.icon = icon;
    
    await department.save();
    console.log(`✅ Department updated: ${department.name}`);
    res.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a department (admin only)
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    // Check if there are doctors in this department
    const doctorsCount = await Doctor.countDocuments({ departmentId: req.params.id });
    if (doctorsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department with ${doctorsCount} doctors assigned. Please reassign or delete the doctors first.` 
      });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    console.log(`✅ Department deleted: ${department.name}`);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;