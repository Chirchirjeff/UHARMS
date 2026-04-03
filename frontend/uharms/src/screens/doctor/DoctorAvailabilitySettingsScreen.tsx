// src/screens/DoctorAvailabilitySettingsScreen.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DoctorStackParamList } from '../../navigation/types';
import { BASE_URL } from '../../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<DoctorStackParamList, 'DoctorAvailabilitySettings'>;

interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface BreakTime {
  start: string;
  end: string;
}

interface ScheduleData {
  _id?: string;
  doctorId: string;
  date: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  slotInterval: number;
  slots: TimeSlot[];
  breakTime: BreakTime;
  notes?: string;
}

const timeOptions = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const DoctorAvailabilitySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  
  // Get doctorId from user object - log it for debugging
  const doctorId = (user as any)?.doctorId;
  console.log('DoctorAvailabilitySettings - doctorId from user:', doctorId);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleData>({
    doctorId: doctorId || '',
    date: new Date().toISOString().split('T')[0],
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    slotInterval: 30,
    slots: [],
    breakTime: { start: '13:00', end: '14:00' },
    notes: '',
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showBreakStartPicker, setShowBreakStartPicker] = useState(false);
  const [showBreakEndPicker, setShowBreakEndPicker] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ index: number; slot: TimeSlot } | null>(null);
  const [tempSlot, setTempSlot] = useState<TimeSlot>({ startTime: '09:00', endTime: '10:00', isBooked: false });

  useEffect(() => {
    if (doctorId) {
      fetchAvailability();
    } else {
      console.log('No doctorId available');
      setLoading(false);
    }
  }, [doctorId, selectedDate]);

  // Check for missing doctorId AFTER all hooks are declared
  if (!doctorId && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={60} color="#ef4444" />
        <Text style={styles.errorTitle}>Doctor ID Not Found</Text>
        <Text style={styles.errorText}>
          Please log out and log in again to refresh your session.
        </Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fetchAvailability = async () => {
    if (!doctorId) {
      console.log('Cannot fetch: doctorId is missing');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const url = `${BASE_URL}/availability/doctor/${doctorId}/date/${dateStr}`;
      
      console.log('Fetching availability from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data) {
        setSchedule({
          doctorId,
          date: dateStr,
          isAvailable: data.isAvailable !== false,
          startTime: data.startTime || '09:00',
          endTime: data.endTime || '17:00',
          slotInterval: data.slotInterval || 30,
          slots: data.slots || [],
          breakTime: data.breakTime || { start: '13:00', end: '14:00' },
          notes: data.notes || '',
        });
      } else {
        console.log('Using default schedule (no existing data)');
        setSchedule({
          doctorId,
          date: dateStr,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          slotInterval: 30,
          slots: [],
          breakTime: { start: '13:00', end: '14:00' },
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      Alert.alert('Connection Error', 'Could not load availability. Using default settings.');
      const dateStr = selectedDate.toISOString().split('T')[0];
      setSchedule({
        doctorId,
        date: dateStr,
        isAvailable: true,
        startTime: '09:00',
        endTime: '17:00',
        slotInterval: 30,
        slots: [],
        breakTime: { start: '13:00', end: '14:00' },
        notes: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlotsForSave = () => {
    const slots: TimeSlot[] = [];
    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);
    const interval = schedule.slotInterval;
    const breakStart = timeToMinutes(schedule.breakTime.start);
    const breakEnd = timeToMinutes(schedule.breakTime.end);
    
    for (let time = start; time < end; time += interval) {
      const startTime = minutesToTime(time);
      const endTime = minutesToTime(time + interval);
      
      const isBreakTime = time >= breakStart && time < breakEnd;
      if (!isBreakTime) {
        slots.push({
          startTime,
          endTime,
          isBooked: false,
        });
      }
    }
    return slots;
  };

  const generateTimeSlots = () => {
    const slots = generateTimeSlotsForSave();
    setSchedule(prev => ({ ...prev, slots }));
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!doctorId) {
      Alert.alert('Error', 'Doctor ID not found. Please log in again.');
      return;
    }
    
    try {
      setSaving(true);
      
      if (!schedule.startTime || !schedule.endTime) {
        Alert.alert('Error', 'Please set working hours');
        return;
      }
      
      if (schedule.startTime >= schedule.endTime) {
        Alert.alert('Error', 'Start time must be before end time');
        return;
      }
      
      let slotsToSave = schedule.slots;
      if (slotsToSave.length === 0 && schedule.isAvailable) {
        slotsToSave = generateTimeSlotsForSave();
      }
      
      const payload = {
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotInterval: schedule.slotInterval,
        isAvailable: schedule.isAvailable,
        breakStart: schedule.breakTime.start,
        breakEnd: schedule.breakTime.end,
        slots: slotsToSave,
        notes: schedule.notes,
      };
      
      console.log('Saving payload:', JSON.stringify(payload, null, 2));
      
      const url = `${BASE_URL}/availability/doctor/${doctorId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      console.log('Save response:', data);
      
      if (response.ok) {
        Alert.alert(
          'Success',
          '✅ Availability saved successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to save availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection.';
      Alert.alert('Error', `Failed to save availability. ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      const url = `${BASE_URL}/availability/doctor/${doctorId}/date/${schedule.date}`;
      console.log('Testing URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      Alert.alert('Debug', `Connection OK!\nStatus: ${response.status}`);
    } catch (error) {
      console.error('Test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Debug', `Error: ${errorMessage}`);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleStartTimeChange = (_event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const time = selectedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setSchedule(prev => ({ ...prev, startTime: time }));
    }
  };

  const handleEndTimeChange = (_event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const time = selectedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setSchedule(prev => ({ ...prev, endTime: time }));
    }
  };

  const handleBreakStartChange = (_event: any, selectedTime?: Date) => {
    setShowBreakStartPicker(false);
    if (selectedTime) {
      const time = selectedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setSchedule(prev => ({ 
        ...prev, 
        breakTime: { start: time, end: prev.breakTime.end }
      }));
    }
  };

  const handleBreakEndChange = (_event: any, selectedTime?: Date) => {
    setShowBreakEndPicker(false);
    if (selectedTime) {
      const time = selectedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setSchedule(prev => ({ 
        ...prev, 
        breakTime: { start: prev.breakTime.start, end: time }
      }));
    }
  };

  const addCustomSlot = () => {
    setEditingSlot(null);
    setTempSlot({ startTime: '09:00', endTime: '10:00', isBooked: false });
    setShowSlotModal(true);
  };

  const saveCustomSlot = () => {
    if (tempSlot.startTime >= tempSlot.endTime) {
      Alert.alert('Error', 'Start time must be before end time');
      return;
    }
    
    if (editingSlot) {
      const newSlots = [...schedule.slots];
      newSlots[editingSlot.index] = tempSlot;
      setSchedule(prev => ({ ...prev, slots: newSlots }));
    } else {
      setSchedule(prev => ({ ...prev, slots: [...prev.slots, tempSlot] }));
    }
    setShowSlotModal(false);
  };

  const removeSlot = (index: number) => {
    const newSlots = schedule.slots.filter((_, i) => i !== index);
    setSchedule(prev => ({ ...prev, slots: newSlots }));
  };

  const renderTimeSlot = ({ item, index }: { item: TimeSlot; index: number }) => (
    <View style={styles.slotItem}>
      <Icon name="clock-outline" size={20} color="#16a34a" />
      <Text style={styles.slotTime}>{item.startTime} - {item.endTime}</Text>
      {item.isBooked ? (
        <View style={styles.bookedBadge}>
          <Text style={styles.bookedText}>Booked</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => removeSlot(index)} style={styles.removeSlotButton}>
          <Icon name="close-circle" size={20} color="#ef4444" />
        </TouchableOpacity>
      )}
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Availability</Text>
        <TouchableOpacity onPress={testConnection} style={styles.debugButton}>
          <Icon name="bug" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
        <Icon name="calendar" size={24} color="#16a34a" />
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <View style={styles.card}>
        <View style={styles.toggleContainer}>
          <View>
            <Text style={styles.cardTitle}>Available on this day</Text>
            <Text style={styles.cardSubtitle}>Toggle off to mark as unavailable</Text>
          </View>
          <Switch
            value={schedule.isAvailable}
            onValueChange={(value) => setSchedule(prev => ({ ...prev, isAvailable: value }))}
            trackColor={{ false: '#767577', true: '#16a34a' }}
            thumbColor={schedule.isAvailable ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {schedule.isAvailable && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Working Hours</Text>
            
            <TouchableOpacity style={styles.timeSelector} onPress={() => setShowStartTimePicker(true)}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <View style={styles.timeValueContainer}>
                <Text style={styles.timeValue}>{schedule.startTime}</Text>
                <Icon name="chevron-down" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
            
            {showStartTimePicker && (
              <DateTimePicker
                value={new Date(`2000-01-01T${schedule.startTime}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
            
            <TouchableOpacity style={styles.timeSelector} onPress={() => setShowEndTimePicker(true)}>
              <Text style={styles.timeLabel}>End Time</Text>
              <View style={styles.timeValueContainer}>
                <Text style={styles.timeValue}>{schedule.endTime}</Text>
                <Icon name="chevron-down" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
            
            {showEndTimePicker && (
              <DateTimePicker
                value={new Date(`2000-01-01T${schedule.endTime}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleEndTimeChange}
              />
            )}
            
            <TextInput
              style={styles.intervalInput}
              value={schedule.slotInterval.toString()}
              onChangeText={(text) => setSchedule(prev => ({ ...prev, slotInterval: parseInt(text) || 30 }))}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Break Time (Optional)</Text>
            
            <TouchableOpacity style={styles.timeSelector} onPress={() => setShowBreakStartPicker(true)}>
              <Text style={styles.timeLabel}>Break Start</Text>
              <View style={styles.timeValueContainer}>
                <Text style={styles.timeValue}>{schedule.breakTime.start}</Text>
                <Icon name="chevron-down" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
            
            {showBreakStartPicker && (
              <DateTimePicker
                value={new Date(`2000-01-01T${schedule.breakTime.start}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleBreakStartChange}
              />
            )}
            
            <TouchableOpacity style={styles.timeSelector} onPress={() => setShowBreakEndPicker(true)}>
              <Text style={styles.timeLabel}>Break End</Text>
              <View style={styles.timeValueContainer}>
                <Text style={styles.timeValue}>{schedule.breakTime.end}</Text>
                <Icon name="chevron-down" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
            
            {showBreakEndPicker && (
              <DateTimePicker
                value={new Date(`2000-01-01T${schedule.breakTime.end}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleBreakEndChange}
              />
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Custom Time Slots</Text>
              <TouchableOpacity onPress={generateTimeSlots} style={styles.generateButton}>
                <Icon name="refresh" size={18} color="#16a34a" />
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.addSlotButton} onPress={addCustomSlot}>
              <Icon name="plus" size={20} color="#16a34a" />
              <Text style={styles.addSlotButtonText}>Add Custom Slot</Text>
            </TouchableOpacity>
            
            <FlatList
              data={schedule.slots}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderTimeSlot}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptySlotsContainer}>
                  <Text style={styles.emptySlotsText}>No time slots added</Text>
                  <Text style={styles.emptySlotsSubtext}>Click "Generate" or "Add Custom Slot"</Text>
                </View>
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={schedule.notes}
              onChangeText={(text) => setSchedule(prev => ({ ...prev, notes: text }))}
              placeholder="Add any notes about your availability..."
              multiline
              numberOfLines={3}
            />
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="content-save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Availability</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={showSlotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
            </Text>
            
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Start Time</Text>
              <View style={styles.modalTimePicker}>
                {timeOptions.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      tempSlot.startTime === time && styles.timeOptionSelected
                    ]}
                    onPress={() => setTempSlot({ ...tempSlot, startTime: time })}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      tempSlot.startTime === time && styles.timeOptionTextSelected
                    ]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>End Time</Text>
              <View style={styles.modalTimePicker}>
                {timeOptions.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      tempSlot.endTime === time && styles.timeOptionSelected
                    ]}
                    onPress={() => setTempSlot({ ...tempSlot, endTime: time })}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      tempSlot.endTime === time && styles.timeOptionTextSelected
                    ]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowSlotModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveCustomSlot}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  debugButton: {
    padding: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  timeLabel: {
    fontSize: 14,
    color: '#1e293b',
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeValue: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  generateButtonText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '500',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  addSlotButtonText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  slotTime: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  bookedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookedText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '500',
  },
  removeSlotButton: {
    padding: 4,
  },
  emptySlotsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptySlotsText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptySlotsSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalRow: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalTimePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  timeOptionSelected: {
    backgroundColor: '#16a34a',
  },
  timeOptionText: {
    fontSize: 12,
    color: '#1e293b',
  },
  timeOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalCancelButtonText: {
    color: '#64748b',
  },
  modalSaveButton: {
    backgroundColor: '#16a34a',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default DoctorAvailabilitySettingsScreen;