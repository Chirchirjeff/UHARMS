// backend/scripts/seedDoctors.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Department from '../models/Department.js';

dotenv.config();

// Kenyan doctor data
const doctorsData = [
  // Cardiology Department
  {
    name: "Dr. James Kemboi",
    email: "james.kemboi@uzima.com",
    password: "doctor123",
    phone: "+254712345678",
    department: "Cardiology",
    specialization: "Interventional Cardiology",
    bio: "Specialist in heart procedures and cardiovascular interventions with over 15 years of experience."
  },
  {
    name: "Dr. Grace Kamau",
    email: "grace.kamau@uzima.com",
    password: "doctor123",
    phone: "+254722345679",
    department: "Cardiology",
    specialization: "Clinical Cardiology",
    bio: "Expert in non-invasive heart disease management and preventive cardiology."
  },
  {
    name: "Dr. Peter Mwangi",
    email: "peter.mwangi@uzima.com",
    password: "doctor123",
    phone: "+254733345680",
    department: "Cardiology",
    specialization: "Electrophysiology",
    bio: "Specialist in heart rhythm disorders and pacemaker implantation."
  },
   // Pediatrics Department
  {
    name: "Dr. Alice Njeri",
    email: "alice.njeri@uzima.com",
    password: "doctor123",
    phone: "+254744345681",
    department: "Pediatrics",
    specialization: "Neonatology",
    bio: "Specialist in newborn care and premature infant development."
  },
  {
    name: "Dr. John Otieno",
    email: "john.otieno@uzima.com",
    password: "doctor123",
    phone: "+254755345682",
    department: "Pediatrics",
    specialization: "Pediatric Infectious Diseases",
    bio: "Expert in childhood infections and immunizations."
  },
  {
    name: "Dr. Sarah Wanjiku",
    email: "sarah.wanjiku@uzima.com",
    password: "doctor123",
    phone: "+254766345683",
    department: "Pediatrics",
    specialization: "Adolescent Medicine",
    bio: "Specialist in teenage health and developmental concerns."
  },

  // General Medicine Department
  {
    name: "Dr. David Omondi",
    email: "david.omondi@uzima.com",
    password: "doctor123",
    phone: "+254777345684",
    department: "General Medicine",
    specialization: "Internal Medicine",
    bio: "Comprehensive care for adults with complex medical conditions."
  },
  {
    name: "Dr. Lucy Kuria",
    email: "lucy.kuria@uzima.com",
    password: "doctor123",
    phone: "+254788345685",
    department: "General Medicine",
    specialization: "Geriatrics",
    bio: "Specialist in elderly care and age-related health issues."
  },
  {
    name: "Dr. Samuel Mutua",
    email: "samuel.mutua@uzima.com",
    password: "doctor123",
    phone: "+254799345686",
    department: "General Medicine",
    specialization: "Family Medicine",
    bio: "Family doctor providing comprehensive primary care for all ages."
  },

  // Maternity & Pregnancy Department
  {
    name: "Dr. Mary Chebet",
    email: "mary.chebet@uzima.com",
    password: "doctor123",
    phone: "+254710345687",
    department: "Maternity & Pregnancy",
    specialization: "Obstetrics",
    bio: "Expert in pregnancy care and delivery management."
  },
  {
    name: "Dr. Esther Kimani",
    email: "esther.kimani@uzima.com",
    password: "doctor123",
    phone: "+254721345688",
    department: "Maternity & Pregnancy",
    specialization: "Maternal-Fetal Medicine",
    bio: "Specialist in high-risk pregnancies and fetal health."
  },

  // Dental Care Department
  {
    name: "Dr. Michael Kipruto",
    email: "michael.kipruto@uzima.com",
    password: "doctor123",
    phone: "+254732345689",
    department: "Dental Care",
    specialization: "Orthodontics",
    bio: "Specialist in teeth alignment and braces."
  },
  {
    name: "Dr. Anne Wambui",
    email: "anne.wambui@uzima.com",
    password: "doctor123",
    phone: "+254743345690",
    department: "Dental Care",
    specialization: "Oral Surgery",
    bio: "Expert in dental surgeries and oral pathology."
  },

  // Orthopedics Department
  {
    name: "Dr. Joseph Kipchoge",
    email: "joseph.kipchoge@uzima.com",
    password: "doctor123",
    phone: "+254754345691",
    department: "Orthopedics",
    specialization: "Joint Replacement",
    bio: "Specialist in hip and knee replacement surgeries."
  },
  {
    name: "Dr. Rose Chepchumba",
    email: "rose.chepchumba@uzima.com",
    password: "doctor123",
    phone: "+254765345692",
    department: "Orthopedics",
    specialization: "Sports Medicine",
    bio: "Expert in sports injuries and rehabilitation."
  },

  // Neurology Department
  {
    name: "Dr. Stephen Njoroge",
    email: "stephen.njoroge@uzima.com",
    password: "doctor123",
    phone: "+254776345693",
    department: "Neurology",
    specialization: "Neurology",
    bio: "Specialist in brain and nervous system disorders."
  },
  {
    name: "Dr. Catherine Muthoni",
    email: "catherine.muthoni@uzima.com",
    password: "doctor123",
    phone: "+254787345694",
    department: "Neurology",
    specialization: "Epilepsy",
    bio: "Expert in seizure disorders and epilepsy management."
  },

  // Ophthalmology Department
  {
    name: "Dr. Patrick Ndegwa",
    email: "patrick.ndegwa@uzima.com",
    password: "doctor123",
    phone: "+254798345695",
    department: "Ophthalmology",
    specialization: "Cataract Surgery",
    bio: "Specialist in cataract removal and lens implants."
  },
  {
    name: "Dr. Elizabeth Muthoka",
    email: "elizabeth.muthoka@uzima.com",
    password: "doctor123",
    phone: "+254709345696",
    department: "Ophthalmology",
    specialization: "Retina Specialist",
    bio: "Expert in retinal diseases and diabetic eye care."
  },

  // ENT Department
  {
    name: "Dr. Charles Maina",
    email: "charles.maina@uzima.com",
    password: "doctor123",
    phone: "+254720345697",
    department: "ENT",
    specialization: "Otology",
    bio: "Specialist in ear disorders and hearing loss."
  },
  {
    name: "Dr. Faith Kariuki",
    email: "faith.kariuki@uzima.com",
    password: "doctor123",
    phone: "+254731345698",
    department: "ENT",
    specialization: "Rhinology",
    bio: "Expert in nasal and sinus disorders."
  },

  // Urology Department
  {
    name: "Dr. Alex Mwangi",
    email: "alex.mwangi@uzima.com",
    password: "doctor123",
    phone: "+254742345699",
    department: "Urology",
    specialization: "Urology",
    bio: "Specialist in urinary tract and male reproductive health."
  },

  // Oncology Department
  {
    name: "Dr. Nancy Kimotho",
    email: "nancy.kimotho@uzima.com",
    password: "doctor123",
    phone: "+254753345700",
    department: "Oncology",
    specialization: "Medical Oncology",
    bio: "Specialist in cancer diagnosis and chemotherapy."
  },
  {
    name: "Dr. Paul Kipkorir",
    email: "paul.kipkorir@uzima.com",
    password: "doctor123",
    phone: "+254764345701",
    department: "Oncology",
    specialization: "Radiation Oncology",
    bio: "Expert in radiation therapy for cancer treatment."
  },

  // Pulmonology Department
  {
    name: "Dr. Susan Muthoni",
    email: "susan.muthoni@uzima.com",
    password: "doctor123",
    phone: "+254775345702",
    department: "Pulmonology",
    specialization: "Pulmonology",
    bio: "Specialist in lung diseases and respiratory care."
  },

  // Gastroenterology Department
  {
    name: "Dr. Francis Kamande",
    email: "francis.kamande@uzima.com",
    password: "doctor123",
    phone: "+254786345703",
    department: "Gastroenterology",
    specialization: "Gastroenterology",
    bio: "Specialist in digestive system and liver disorders."
  },

  // Mental Health Department
  {
    name: "Dr. Carol Wairimu",
    email: "carol.wairimu@uzima.com",
    password: "doctor123",
    phone: "+254797345704",
    department: "Mental Health",
    specialization: "Psychiatry",
    bio: "Specialist in mental health and psychiatric disorders."
  },
  {
    name: "Dr. Tom Odhiambo",
    email: "tom.odhiambo@uzima.com",
    password: "doctor123",
    phone: "+254708345705",
    department: "Mental Health",
    specialization: "Clinical Psychology",
    bio: "Expert in therapy and counseling services."
  }
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uharms');
    console.log('✅ Connected to MongoDB');

    // Get all departments
    const departments = await Department.find();
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.name] = dept._id;
    });

    console.log('📋 Departments found:', Object.keys(departmentMap).length);

    let created = 0;
    let skipped = 0;

    for (const doctorData of doctorsData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: doctorData.email });
      
      if (existingUser) {
        console.log(`⏭️ Skipping ${doctorData.name} - email already exists`);
        skipped++;
        continue;
      }

      // Find department ID by name
      let departmentId = null;
      if (doctorData.department) {
        departmentId = departmentMap[doctorData.department];
        if (!departmentId) {
          console.log(`⚠️ Warning: Department "${doctorData.department}" not found for ${doctorData.name}.`);
        }
      }

      // Hash the password - THIS IS CRITICAL
      const hashedPassword = await bcrypt.hash(doctorData.password, 10);
      console.log(`🔐 Hashed password for ${doctorData.name}: ${hashedPassword.substring(0, 20)}...`);

      // Create User with hashed password
      const user = new User({
        name: doctorData.name,
        email: doctorData.email,
        password: hashedPassword, // Store the hashed password
        phone: doctorData.phone,
        role: 'doctor',
        status: 'active'
      });

      await user.save();
      console.log(`👤 Created user: ${doctorData.name}`);

      // Create Doctor profile
      const doctor = new Doctor({
        userId: user._id,
        departmentId: departmentId,
        specialization: doctorData.specialization,
        bio: doctorData.bio,
        status: 'active'
      });

      await doctor.save();
      console.log(`✅ Created doctor profile: ${doctorData.name}`);
      created++;
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`📊 Created: ${created} doctors`);
    console.log(`⏭️ Skipped: ${skipped} doctors`);
    console.log('\n🔐 All doctors can login with:');
    console.log('   Password: doctor123');
    console.log('\n💡 Example login:');
    console.log(`   Email: james.kemboi@uzima.com`);
    console.log(`   Password: doctor123`);

  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedDoctors();