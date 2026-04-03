// src/navigation/DoctorStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DoctorStackParamList } from './types';
import DoctorBottomTabs from './DoctorBottomTabs';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorPatientsScreen from '../screens/doctor/DoctorPatientsScreen';
import DoctorPrescriptionScreen from '../screens/doctor/DoctorPrescriptionScreen';
import DoctorPatientDetailScreen from '../screens/doctor/DoctorPatientDetailScreen';
import DoctorAvailabilitySettingsScreen from '../screens/doctor/DoctorAvailabilitySettingsScreen';
import ChatScreen from '../screens/shared/ChatScreen';

const Stack = createNativeStackNavigator<DoctorStackParamList>();

export default function DoctorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorApp" component={DoctorBottomTabs} />
      <Stack.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} />
      <Stack.Screen name="DoctorPatients" component={DoctorPatientsScreen} />
      <Stack.Screen name="DoctorPrescription" component={DoctorPrescriptionScreen} />
      <Stack.Screen name="DoctorPatientDetail" component={DoctorPatientDetailScreen} />
      <Stack.Screen name="DoctorAvailabilitySettings" component={DoctorAvailabilitySettingsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}