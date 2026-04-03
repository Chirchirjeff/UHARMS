// screens/PatientAppointmentsScreen.tsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';

interface DoctorInfo {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  bio?: string;
}

interface Booking {
  _id: string;
  doctorId: DoctorInfo;
  patientId: string;
  date: string;
  time: string;
  status: 'booked' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const PatientAppointmentsScreen: React.FC = () => {
  const { user } = useContext(AuthContext);
  
  // IMPORTANT: Use patientId from user object, not user.id
  // patientId is the ID from the Patient collection
  const patientId = (user as any)?.patientId || user?.id;
  
  console.log('PatientAppointmentsScreen - patientId:', patientId);
  console.log('User object:', user);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!patientId) {
      console.log('No patientId available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching bookings for patient:', patientId);
      const response = await fetch(`${BASE_URL}/patients/${patientId}/bookings`);
      const data = await response.json();
      
      console.log('Bookings response status:', response.status);
      console.log('Bookings data:', data);
      
      if (response.ok) {
        setBookings(data);
      } else {
        Alert.alert("Error", data.error || "Failed to load appointments");
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [patientId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(bookingId);
              
              const response = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json"
                }
              });

              const data = await response.json();

              if (response.ok) {
                setBookings(prevBookings => 
                  prevBookings.map(booking => 
                    booking._id === bookingId 
                      ? { ...booking, status: 'cancelled' } 
                      : booking
                  )
                );
                
                Alert.alert("Success", "Appointment cancelled successfully");
              } else {
                Alert.alert("Error", data.error || "Failed to cancel appointment");
              }
            } catch (error) {
              console.error("Cancel error:", error);
              Alert.alert("Error", "Failed to connect to server");
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
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
      case 'booked': return '#16a34a';
      case 'cancelled': return '#dc2626';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Confirmed ✓';
      case 'cancelled': return 'Cancelled ✗';
      case 'completed': return 'Completed ✓';
      default: return status;
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={[styles.bookingCard, item.status === 'cancelled' && styles.cancelledCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.doctorName}>
          Dr. {item.doctorId?.userId?.name || 'Unknown Doctor'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{item.time}</Text>
        </View>

        {item.doctorId?.bio && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Specialty:</Text>
            <Text style={styles.detailValue}>{item.doctorId.bio}</Text>
          </View>
        )}

        {item.doctorId?.userId?.phone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>{item.doctorId.userId.phone}</Text>
          </View>
        )}
      </View>

      {item.status === 'booked' && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => handleCancelBooking(item._id)}
          disabled={cancellingId === item._id}
        >
          {cancellingId === item._id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptyText}>
        You don't have any appointments yet.{'\n'}
        Book your first appointment from the departments tab.
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
      <Text style={styles.title}>My Appointments</Text>
      
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
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
    padding: 16, 
    backgroundColor: '#f8fafc' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 16,
    color: '#1e293b'
  },
  listContent: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  bookingCard: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelledCard: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorName: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 70,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PatientAppointmentsScreen;