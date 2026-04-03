// src/navigation/PatientBottomTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PatientTabParamList, PatientStackParamList } from './types';
import PatientDashboardScreen from '../screens/patient/PatientDashboardScreen';
import PatientAppointmentsScreen from '../screens/patient/PatientAppointmentsScreen';
import MessageListScreen from '../screens/shared/MessageListScreen';
import { commonTabOptions, tabBarColors } from './tabStyles';

const Tab = createBottomTabNavigator<PatientTabParamList>();

const DepartmentsWrapper = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  
  React.useEffect(() => {
    navigation.navigate('Department');
  }, []);
  
  return null;
};

const PatientBottomTabs = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{
        ...commonTabOptions,
        tabBarActiveTintColor: tabBarColors.patient,
        tabBarInactiveTintColor: tabBarColors.inactive,
      }}
      screenListeners={({ route }) => ({
        tabPress: (e) => {
          if (route.name === 'Departments') {
            e.preventDefault();
            navigation.navigate('Department');
          }
        },
      })}
    >
      <Tab.Screen
        name="PatientDashboard"
        component={PatientDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Departments"
        component={DepartmentsWrapper}
        options={{
          title: 'Departments',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hospital-building" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PatientAppointments"
        component={PatientAppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
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

export default PatientBottomTabs;