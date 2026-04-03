// src/navigation/types.ts

// ROOT STACK (APP LEVEL)
export type RootStackParamList = {
  AuthStack: undefined;
  PatientStack: undefined;
  DoctorStack: undefined;
};

// AUTH STACK
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  PatientSignup: undefined;
};

// PATIENT STACK
export type PatientStackParamList = {
  PatientApp: undefined;
  Department: undefined;
  DoctorList: { departmentId: string; departmentName: string };
  DoctorAvailability: { doctorId: string; doctorName: string };
  Appointments: { doctorId?: string };
  ChatScreen: {
    conversationId: string;
    otherUser: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    appointment?: {
      _id: string;
      date: string;
      time: string;
    };
  };
};

// PATIENT BOTTOM TABS
export type PatientTabParamList = {
  PatientDashboard: undefined;
  Departments: undefined;
  PatientAppointments: undefined;
  Messages: undefined;
};

// DOCTOR STACK
export type DoctorStackParamList = {
  DoctorApp: undefined;
  DoctorAppointments: undefined;
  DoctorPatients: undefined;
  DoctorPrescription: { patientId: string; appointmentId?: string };
  DoctorPatientDetail: { patientId: string };
  DoctorAvailabilitySettings: undefined;
  ChatScreen: {
    conversationId: string;
    otherUser: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    appointment?: {
      _id: string;
      date: string;
      time: string;
    };
  };
};

// DOCTOR BOTTOM TABS
export type DoctorTabParamList = {
  DoctorDashboard: undefined;
  DoctorAppointments: undefined;
  DoctorMessages: undefined;
};