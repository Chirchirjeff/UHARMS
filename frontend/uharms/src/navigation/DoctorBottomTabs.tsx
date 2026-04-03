// src/navigation/DoctorBottomTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DoctorTabParamList } from './types';
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import MessageListScreen from '../screens/shared/MessageListScreen';
import { commonTabOptions, tabBarColors } from './tabStyles';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

const DoctorBottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        ...commonTabOptions,
        tabBarActiveTintColor: tabBarColors.doctor,
        tabBarInactiveTintColor: tabBarColors.inactive,
      }}
    >
      <Tab.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorAppointments"
        component={DoctorAppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorMessages"
        component={MessageListScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default DoctorBottomTabs;