import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String
});

export default mongoose.model("Department", departmentSchema);