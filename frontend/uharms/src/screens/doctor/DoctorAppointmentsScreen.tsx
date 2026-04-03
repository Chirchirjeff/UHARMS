import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PatientInfo {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  _id: string;
  date: string;
  time: string;
  status: 'booked' | 'confirmed' | 'cancelled' | 'completed';
  patientId: PatientInfo;
  createdAt: string;
}

const DoctorAppointmentsScreen: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  
  // Get doctor ID - use doctorId from user object
  const doctorId = (user as any)?.doctorId || user?.id;
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!doctorId) return;
    
    try {
      const response = await fetch(`${BASE_URL}/doctors/${doctorId}/appointments`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Appointments received:', data);
        setAppointments(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (doctorId) {
        fetchAppointments();
      }
    }, [doctorId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      setUpdatingId(appointmentId);
      
      console.log(`Updating appointment ${appointmentId} to status: ${status}`);
      
      const response = await fetch(`${BASE_URL}/bookings/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local state
        setAppointments(prev =>
          prev.map(apt =>
            apt._id === appointmentId ? { ...apt, status: status as any } : apt
          )
        );
        
        Alert.alert(
          'Success', 
          `Appointment ${status} successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to dashboard to see updated stats
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return '#f59e0b';
      case 'confirmed': return '#16a34a';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientId?.name || 'Unknown Patient'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={16} color="#64748b" />
          <Text style={styles.detailText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="clock-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="email-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.patientId?.email || 'No email'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="phone-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.patientId?.phone || 'No phone'}</Text>
        </View>
      </View>

      {item.status === 'booked' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.confirmButton]}
            onPress={() => updateAppointmentStatus(item._id, 'confirmed')}
            disabled={updatingId === item._id}
          >
            {updatingId === item._id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirm</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => updateAppointmentStatus(item._id, 'cancelled')}
            disabled={updatingId === item._id}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'confirmed' && (
        <TouchableOpacity 
          style={[styles.button, styles.completeButton]}
          onPress={() => updateAppointmentStatus(item._id, 'completed')}
          disabled={updatingId === item._id}
        >
          {updatingId === item._id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Mark as Completed</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-blank" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptyText}>
        You don't have any appointment requests yet.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Requests</Text>
      
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DoctorAppointmentsScreen;