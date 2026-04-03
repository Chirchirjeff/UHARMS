// backend/scripts/seedDepartments.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../models/Department.js';

dotenv.config();

const departmentsData = [
  {
    name: "Cardiology",
    description: "Heart health and cardiovascular care",
    icon: "heart"
  },
  {
    name: "Pediatrics",
    description: "Children's health, immunizations, growth monitoring",
    icon: "child"
  },
  {
    name: "Maternity & Pregnancy",
    description: "Prenatal care, childbirth, postnatal services",
    icon: "baby"
  },
  {
    name: "General Medicine",
    description: "Diagnosis and treatment of common illnesses",
    icon: "medical"
  },
  {
    name: "Dental Care",
    description: "Oral exams, cleaning, and dental treatments",
    icon: "tooth"
  },
  {
    name: "Orthopedics",
    description: "Bones, joints, fractures, and injuries",
    icon: "bone"
  },
  {
    name: "Neurology",
    description: "Brain, nerves, and neurological disorders",
    icon: "brain"
  },
  {
    name: "Ophthalmology",
    description: "Eye care and vision health",
    icon: "eye"
  },
  {
    name: "ENT",
    description: "Ear, nose, and throat treatments",
    icon: "ear"
  },
  {
    name: "Urology",
    description: "Urinary tract and male reproductive health",
    icon: "kidney"
  },
  {
    name: "Oncology",
    description: "Cancer diagnosis and treatment",
    icon: "ribbon"
  },
  {
    name: "Pulmonology",
    description: "Lung and respiratory care",
    icon: "lungs"
  },
  {
    name: "Gastroenterology",
    description: "Digestive system and stomach disorders",
    icon: "stomach"
  },
  {
    name: "Mental Health",
    description: "Counseling, therapy, and psychiatric support",
    icon: "brain"
  }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    console.log('✅ Connected to MongoDB');

    // Check if departments already exist
    const existingCount = await Department.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing departments.`);
      console.log('Do you want to:');
      console.log('1. Keep existing departments');
      console.log('2. Delete all and re-seed');
      console.log('3. Cancel');
      
      // For automatic seeding without prompt, you can uncomment one of these:
      // await Department.deleteMany({});
      // console.log('🗑️ Deleted existing departments');
    }

    // Uncomment to force delete existing departments:
    // await Department.deleteMany({});
    // console.log('🗑️ Deleted existing departments');

    let created = 0;
    let skipped = 0;

    for (const deptData of departmentsData) {
      // Check if department already exists
      const existingDept = await Department.findOne({ name: deptData.name });
      
      if (existingDept) {
        console.log(`⏭️ Skipping ${deptData.name} - already exists`);
        skipped++;
        continue;
      }

      const department = new Department({
        name: deptData.name,
        description: deptData.description,
        icon: deptData.icon
      });

      await department.save();
      console.log(`✅ Created department: ${deptData.name}`);
      created++;
    }

    console.log('\n🎉 Department seeding complete!');
    console.log(`📊 Created: ${created} departments`);
    console.log(`⏭️ Skipped: ${skipped} (already exist)`);
    
    // List all departments
    const allDepartments = await Department.find();
    console.log('\n📋 Departments in database:');
    allDepartments.forEach(dept => {
      console.log(`   - ${dept.name} (ID: ${dept._id})`);
    });

  } catch (error) {
    console.error('❌ Error seeding departments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedDepartments();