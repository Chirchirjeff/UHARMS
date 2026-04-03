import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: false
  },
  specialization: {
    type: String,
    default: "General"
  },
  bio: {
    type: String,
    default: ""
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["active", "inactive", "on-leave"],
    default: "active"
  }
}, {
  timestamps: true
});

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;