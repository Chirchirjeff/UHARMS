// src/screens/patient/DoctorAvailabilityScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<PatientStackParamList, 'DoctorAvailability'>;

interface Slot {
  _id?: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  isBooked?: boolean;
}

interface Booking {
  _id: string;
  date: string;
  time: string;
  status: string;
  patientId: string;
}

const DoctorAvailabilityScreen: React.FC<Props> = ({ route, navigation }) => {
  const { doctorId, doctorName } = route.params;
  const { user } = useContext(AuthContext);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get the patient ID
  const patientId = (user as any)?.patientId || user?.id;

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    try {
      setLoading(true);

      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log(`Fetching slots for doctor: ${doctorId} on date: ${dateStr}`);

      let slotsData: Slot[] = [];
      
      try {
        const availabilityResponse = await fetch(`${BASE_URL}/availability/doctor/${doctorId}/date/${dateStr}`);
        
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          console.log("Availability data:", availabilityData);
          
          if (availabilityData.slots && availabilityData.slots.length > 0) {
            slotsData = availabilityData.slots.map((slot: any) => ({
              date: dateStr,
              time: `${slot.startTime} - ${slot.endTime}`,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBooked: slot.isBooked || false
            }));
          }
        }
      } catch (error) {
        console.log("No availability endpoint, falling back to slots endpoint");
      }
      
      if (slotsData.length === 0) {
        const slotsResponse = await fetch(`${BASE_URL}/doctors/${doctorId}/slots?date=${dateStr}`);
        if (slotsResponse.ok) {
          slotsData = await slotsResponse.json();
        }
      }
      
      console.log("Slots received:", slotsData);
      setSlots(slotsData);

      // Fetch patient bookings
      if (patientId) {
        const bookingsResponse = await fetch(`${BASE_URL}/patients/${patientId}/bookings`);
        if (bookingsResponse.ok) {
          const bookingsData: Booking[] = await bookingsResponse.json();
          console.log("Bookings received:", bookingsData);
          setBookings(bookingsData);
        }
      }

    } catch (err) {
      console.error("Slot fetch error:", err);
      Alert.alert("Error", "Failed to load doctor availability.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleBookSlot = async (slot: Slot) => {
    if (!patientId) {
      Alert.alert("Error", "Please log in to book an appointment.");
      return;
    }

    const slotTime = slot.time.includes(' - ') ? slot.time.split(' - ')[0] : slot.time;
    
    const alreadyBooked = bookings.find(
      b => b.date === slot.date && 
           (b.time === slot.time || b.time === slotTime) && 
           b.status === "booked"
    );

    if (alreadyBooked) {
      Alert.alert("Already Booked", "You already booked this slot.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          doctorId,
          patientId: patientId,
          date: slot.date,
          time: slotTime
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      console.log("Booking created:", data);

      Alert.alert(
  "Success",
  `Appointment booked for ${slot.date} at ${slot.time}`,
  [
    {
      text: "View My Appointments",
      onPress: () => {
        // Reset the stack to show only the tabs, then switch to appointments tab
        navigation.reset({
          index: 0,
          routes: [{ name: 'PatientApp', params: { screen: 'PatientAppointments' } }],
        });
      }
    },
    {
      text: "Dashboard",
      onPress: () => {
        // Reset the stack to show only the tabs (dashboard is default)
        navigation.reset({
          index: 0,
          routes: [{ name: 'PatientApp' }],
        });
      }
    }
  ],
  { cancelable: false }
);

    } catch (err) {
      console.error("Booking error:", err);
      let errorMessage = "Failed to book slot.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderSlot = ({ item }: { item: Slot }) => {
    const slotTime = item.time.includes(' - ') ? item.time.split(' - ')[0] : item.time;
    const isBooked = bookings.some(
      b => b.date === item.date && 
           (b.time === item.time || b.time === slotTime) && 
           b.status === "booked"
    ) || item.isBooked === true;

    return (
      <TouchableOpacity
        style={[styles.slotCard, isBooked && styles.bookedSlot]}
        onPress={() => !isBooked && handleBookSlot(item)}
        disabled={isBooked}
      >
        <View style={styles.slotContent}>
          <Icon name="clock-outline" size={20} color={isBooked ? "#666" : "#16a34a"} />
          <Text style={[styles.slotText, isBooked && styles.bookedText]}>
            {item.time}
          </Text>
          {isBooked && (
            <View style={styles.bookedBadge}>
              <Text style={styles.bookedBadgeText}>Booked</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#16a34a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Slots</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.doctorInfo}>
        <Icon name="doctor" size={24} color="#16a34a" />
        <Text style={styles.doctorName}>Dr. {doctorName}</Text>
      </View>

      {/* Date Selector */}
      <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
        <Icon name="calendar" size={20} color="#16a34a" />
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <Icon name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.title}>
        Select a time slot
      </Text>

      {slots.length === 0 ? (
        <View style={styles.noSlotsContainer}>
          <Icon name="calendar-blank" size={48} color="#ccc" />
          <Text style={styles.noSlotsText}>No available slots</Text>
          <Text style={styles.noSlotsSubtext}>
            Please try another date
          </Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item, index) => `${item.date}_${item.time}_${index}`}
          renderItem={renderSlot}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default DoctorAvailabilityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc"
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    elevation: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#1e293b',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  bookedSlot: {
    backgroundColor: '#f1f5f9',
    opacity: 0.8,
  },
  bookedText: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  bookedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookedBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '500',
  },
  noSlotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 12,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});