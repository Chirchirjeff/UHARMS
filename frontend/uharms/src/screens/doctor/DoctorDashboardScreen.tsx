// src/screens/doctor/DoctorDashboardScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoctorTabParamList, DoctorStackParamList } from '../../navigation/types';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = BottomTabScreenProps<DoctorTabParamList, 'DoctorDashboard'>;

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  pendingAppointments: number;
  completedToday: number;
}

interface DoctorProfile {
  _id: string;
  userId: string;
  specialization: string;
  bio: string;
  departmentId: {
    _id: string;
    name: string;
    description?: string;
  };
  status: string;
}

interface Appointment {
  _id: string;
  date: string;
  time: string;
  status: string;
  patientId?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Activity {
  id: string;
  type: 'appointment' | 'patient' | 'message' | 'prescription';
  title: string;
  description: string;
  time: string;
  icon: string;
  iconColor: string;
}

const DoctorDashboardScreen: React.FC<Props> = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const stackNavigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    pendingAppointments: 0,
    completedToday: 0,
  });
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');

  // Get the doctor ID from user object
  const doctorId = (user as any)?.doctorId || user?.id;

  useEffect(() => {
    if (doctorId) {
      loadDashboardData();
    } else {
      console.log('No doctor ID available');
      setLoading(false);
    }
  }, [doctorId]);

  const loadDashboardData = async () => {
    if (!doctorId) return;
    
    try {
      // Fetch doctor profile with department info using the correct endpoint
      const profileResponse = await fetch(`${BASE_URL}/doctors/${doctorId}`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Doctor profile data:', JSON.stringify(profileData, null, 2));
        
        setDoctorProfile(profileData);
        
        // Extract department name from the response
        if (profileData.departmentId) {
          if (typeof profileData.departmentId === 'object') {
            setDepartmentName(profileData.departmentId.name || '');
          } else {
            // If departmentId is just an ID, we need to fetch department details
            const deptResponse = await fetch(`${BASE_URL}/departments/${profileData.departmentId}`);
            if (deptResponse.ok) {
              const deptData = await deptResponse.json();
              setDepartmentName(deptData.name || '');
            }
          }
        }
        
        // Set specialization
        setSpecialization(profileData.specialization || '');
      } else {
        // Fallback: try the profile endpoint
        const fallbackResponse = await fetch(`${BASE_URL}/doctors/profile/${user?.id}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback profile data:', fallbackData);
          
          if (fallbackData.doctorProfile?.departmentId?.name) {
            setDepartmentName(fallbackData.doctorProfile.departmentId.name);
          }
          if (fallbackData.doctorProfile?.specialization) {
            setSpecialization(fallbackData.doctorProfile.specialization);
          }
          setDoctorProfile(fallbackData.doctorProfile);
        }
      }

      // Fetch stats
      const statsResponse = await fetch(`${BASE_URL}/doctors/${doctorId}/stats`);
      const statsData = await statsResponse.json();
      if (statsResponse.ok) {
        setStats(statsData);
      }

      // Fetch recent appointments
      const appointmentsResponse = await fetch(`${BASE_URL}/doctors/${doctorId}/appointments?limit=5`);
      const appointmentsData = await appointmentsResponse.json();
      if (appointmentsResponse.ok) {
        setRecentAppointments(appointmentsData);
        generateActivities(appointmentsData);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateActivities = (appointments: Appointment[]) => {
    const newActivities: Activity[] = [];
    
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    completedAppointments.forEach(apt => {
      newActivities.push({
        id: `apt_${apt._id}`,
        type: 'appointment',
        title: 'Appointment Completed',
        description: `Consultation with ${apt.patientId?.name || 'a patient'}`,
        time: apt.date,
        icon: 'check-circle',
        iconColor: '#10b981',
      });
    });

    const upcomingAppointments = appointments.filter(a => a.status === 'booked' || a.status === 'confirmed');
    upcomingAppointments.forEach(apt => {
      newActivities.push({
        id: `upcoming_${apt._id}`,
        type: 'appointment',
        title: 'Upcoming Appointment',
        description: `Scheduled with ${apt.patientId?.name || 'a patient'} at ${apt.time}`,
        time: apt.date,
        icon: 'calendar-clock',
        iconColor: '#3b82f6',
      });
    });

    newActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(newActivities.slice(0, 5));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleViewPatients = () => {
    stackNavigation.navigate('DoctorPatients');
  };

  const handleUpdateAvailability = () => {
    stackNavigation.navigate('DoctorAvailabilitySettings');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#16a34a';
      case 'booked': return '#f59e0b';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'booked': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status || 'Scheduled';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Determine what to display under the doctor's name
  const getDoctorTitle = () => {
    if (departmentName) return departmentName;
    if (specialization) return specialization;
    return 'General Practitioner';
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>Dr. {user?.name || 'Doctor'}</Text>
            <Text style={styles.department}>
              {getDoctorTitle()}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="calendar-today" size={28} color="#16a34a" />
          <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="account-group" size={28} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="clock-outline" size={28} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.pendingAppointments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="check-circle" size={28} color="#10b981" />
          <Text style={styles.statNumber}>{stats.completedToday}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions - Messages removed since it's in bottom nav */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={handleViewPatients}>
          <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
            <Icon name="account-multiple" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>My Patients</Text>
          <Text style={styles.actionSubtitle}>View patient list</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleUpdateAvailability}>
          <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
            <Icon name="clock-edit" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Availability</Text>
          <Text style={styles.actionSubtitle}>Set working hours</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      {activities.length > 0 ? (
        activities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: `${activity.iconColor}20` }]}>
              <Icon name={activity.icon} size={20} color={activity.iconColor} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTime}>{formatRelativeTime(activity.time)}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyActivityCard}>
          <Icon name="clock-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>Your recent appointments will appear here</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  department: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyActivityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});

export default DoctorDashboardScreen;