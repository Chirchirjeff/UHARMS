// src/screens/patient/PatientDashboardScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientTabParamList, PatientStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BASE_URL } from '../../config/api';

type Props = BottomTabScreenProps<PatientTabParamList, 'PatientDashboard'>;

interface Appointment {
  _id: string;
  date: string;
  time: string;
  status: 'booked' | 'confirmed' | 'cancelled' | 'completed';
  doctorId?: {
    userId?: {
      name: string;
    };
  };
  createdAt?: string;
}

const PatientDashboardScreen: React.FC<Props> = () => {
  const { user, logout } = useContext(AuthContext);
  const stackNavigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    confirmedCount: 0,
    totalCount: 0,
    completedCount: 0,
  });

  const patientId = (user as any)?.patientId || user?.id;

  useEffect(() => {
    if (patientId) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const fetchAppointments = async () => {
    if (!patientId) return;
    
    try {
      const response = await fetch(`${BASE_URL}/patients/${patientId}/bookings`);
      if (response.ok) {
        const data: Appointment[] = await response.json();
        setAppointments(data);
        
        // Calculate stats correctly
        const today = new Date().toISOString().split('T')[0];
        
        // Upcoming: booked or confirmed appointments with future dates
        const upcoming = data.filter(a => 
          (a.status === 'booked' || a.status === 'confirmed') && 
          a.date >= today
        );
        
        // Confirmed but not completed (these are upcoming too)
        const confirmed = data.filter(a => 
          a.status === 'confirmed' && a.date >= today
        );
        
        // Completed appointments
        const completed = data.filter(a => a.status === 'completed');
        
        setStats({
          upcomingCount: upcoming.length,
          confirmedCount: confirmed.length,
          totalCount: data.length,
          completedCount: completed.length,
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleLogout = () => {
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
          }
        }
      ]
    );
  };

  const handleBookAppointment = () => {
    stackNavigation.navigate('Department');
  };

  const handleViewAppointments = () => {
    // Navigate to appointments tab
  };

  const getNextAppointment = () => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments
      .filter(a => (a.status === 'booked' || a.status === 'confirmed') && a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (upcoming.length > 0) {
      const next = upcoming[0];
      return {
        date: next.date,
        time: next.time,
        doctorName: next.doctorId?.userId?.name || 'Doctor',
        status: next.status
      };
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRecentAppointments = () => {
    return appointments.slice(0, 3).map(apt => ({
      id: apt._id,
      status: apt.status,
      doctorName: apt.doctorId?.userId?.name || 'Doctor',
      date: apt.date,
      time: apt.time,
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return { text: 'Pending', color: '#f59e0b', bg: '#fef3c7' };
      case 'confirmed':
        return { text: 'Confirmed', color: '#16a34a', bg: '#e6f7e6' };
      case 'completed':
        return { text: 'Completed', color: '#6b7280', bg: '#f3f4f6' };
      case 'cancelled':
        return { text: 'Cancelled', color: '#ef4444', bg: '#fee2e2' };
      default:
        return { text: 'Scheduled', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const nextAppointment = getNextAppointment();
  const recentAppointments = getRecentAppointments();

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
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name || 'Patient'}</Text>
            <Text style={styles.welcomeText}>Welcome back! 👋</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="calendar-clock" size={28} color="#16a34a" />
          <Text style={styles.statNumber}>{stats.upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="calendar-check" size={28} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.confirmedCount}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="check-circle" size={28} color="#10b981" />
          <Text style={styles.statNumber}>{stats.completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Next Appointment Banner */}
      {nextAppointment ? (
        <View style={styles.appointmentBanner}>
          <View style={styles.appointmentBannerContent}>
            <MaterialCommunityIcons name="calendar-star" size={24} color="#fff" />
            <View style={styles.appointmentBannerText}>
              <Text style={styles.appointmentBannerTitle}>
                {nextAppointment.status === 'confirmed' ? 'Confirmed Appointment' : 'Upcoming Appointment'}
              </Text>
              <Text style={styles.appointmentBannerDoctor}>Dr. {nextAppointment.doctorName}</Text>
              <Text style={styles.appointmentBannerTime}>
                {formatDate(nextAppointment.date)} at {nextAppointment.time}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noAppointmentCard}>
          <MaterialCommunityIcons name="calendar-blank" size={40} color="#ccc" />
          <Text style={styles.noAppointmentText}>No upcoming appointments</Text>
          <Text style={styles.noAppointmentSubtext}>Book your first appointment below</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity
        style={styles.bookAppointmentCard}
        onPress={handleBookAppointment}
      >
        <View style={styles.bookAppointmentContent}>
          <View style={styles.bookAppointmentIcon}>
            <MaterialCommunityIcons name="calendar-plus" size={28} color="#fff" />
          </View>
          <View style={styles.bookAppointmentText}>
            <Text style={styles.bookAppointmentTitle}>Book New Appointment</Text>
            <Text style={styles.bookAppointmentSubtitle}>Schedule a visit with a doctor</Text>
          </View>
          <Icon name="arrow-forward" size={20} color="#16a34a" />
        </View>
      </TouchableOpacity>

      {/* Recent Appointments */}
      <Text style={styles.sectionTitle}>Recent Appointments</Text>
      {recentAppointments.length > 0 ? (
        recentAppointments.map((apt) => {
          const statusInfo = getStatusBadge(apt.status);
          return (
            <View key={apt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentIcon}>
                <MaterialCommunityIcons 
                  name={apt.status === 'completed' ? 'check-circle' : 'clock-outline'} 
                  size={24} 
                  color={apt.status === 'completed' ? '#10b981' : '#f59e0b'} 
                />
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentDoctor}>Dr. {apt.doctorName}</Text>
                <Text style={styles.appointmentDateTime}>
                  {formatDate(apt.date)} at {apt.time}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.text}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="calendar-blank" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No appointments yet</Text>
          <Text style={styles.emptySubtext}>Book your first appointment to get started</Text>
        </View>
      )}

      {/* View All Appointments Link */}
      {appointments.length > 0 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {
            // Navigate to appointments tab
          }}
        >
          <Text style={styles.viewAllText}>View All Appointments</Text>
          <Icon name="arrow-forward" size={16} color="#16a34a" />
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  appointmentBanner: {
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  appointmentBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  appointmentBannerTitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  appointmentBannerDoctor: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  appointmentBannerTime: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  noAppointmentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  noAppointmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 12,
  },
  noAppointmentSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  bookAppointmentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  bookAppointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookAppointmentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookAppointmentText: {
    flex: 1,
  },
  bookAppointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  bookAppointmentSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  appointmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  appointmentDateTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 12,
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
});

export default PatientDashboardScreen;