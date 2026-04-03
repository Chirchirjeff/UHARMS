// src/navigation/PatientStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PatientStackParamList } from './types';
import PatientBottomTabs from './PatientBottomTabs';
import DepartmentScreen from '../screens/patient/DepartmentScreen';
import DoctorListScreen from '../screens/patient/DoctorListScreen';
import DoctorAvailabilityScreen from '../screens/patient/DoctorAvailabilityScreen';
import PatientAppointmentsScreen from '../screens/patient/PatientAppointmentsScreen';
import ChatScreen from '../screens/shared/ChatScreen';

const Stack = createNativeStackNavigator<PatientStackParamList>();

export default function PatientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientApp" component={PatientBottomTabs} />
      <Stack.Screen name="Department" component={DepartmentScreen} />
      <Stack.Screen name="DoctorList" component={DoctorListScreen} />
      <Stack.Screen name="DoctorAvailability" component={DoctorAvailabilityScreen} />
      <Stack.Screen name="Appointments" component={PatientAppointmentsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}