// src/screens/shared/ChatScreen.tsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DoctorStackParamList, PatientStackParamList } from '../../navigation/types';

type ChatScreenProps =
  | NativeStackScreenProps<PatientStackParamList, 'ChatScreen'>
  | NativeStackScreenProps<DoctorStackParamList, 'ChatScreen'>;

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
  };
  content: string;
  messageType: 'text' | 'prescription' | 'booking_confirmation';
  prescriptionData?: {
    diagnosis: string;
    medicines: Array<{ name: string; dosage: string; duration: string }>;
    notes: string;
  };
  createdAt: string;
  isRead: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { conversationId, otherUser, appointment } = route.params;
  const { user, token } = useContext(AuthContext);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    medicines: [{ name: '', dosage: '', duration: '' }],
    notes: '',
  });

  const flatListRef = useRef<FlatList>(null);
  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    fetchMessages();

    navigation.setOptions({
      title: otherUser?.name || 'Chat',
      headerTitleAlign: 'center',
    });
  }, []);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      
      const response = await fetch(`${BASE_URL}/messages/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Messages received:', data.length);
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, type: string = 'text', prescriptionData?: any) => {
    if (!content.trim() && type === 'text') return;

    setSending(true);

    const tempMessage: Message = {
      _id: Date.now().toString(),
      senderId: {
        _id: user?.id || '',
        name: user?.name || '',
      },
      content: content.trim(),
      messageType: type as any,
      prescriptionData,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch(`${BASE_URL}/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          messageType: type,
          prescriptionData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempMessage._id ? data : msg))
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const addMedicine = () => {
    setPrescription((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', duration: '' }],
    }));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = [...prescription.medicines];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription((prev) => ({ ...prev, medicines: updated }));
  };

  const removeMedicine = (index: number) => {
    const updated = prescription.medicines.filter((_, i) => i !== index);
    setPrescription((prev) => ({ ...prev, medicines: updated }));
  };

  const sendPrescription = async () => {
    if (!prescription.diagnosis.trim()) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return;
    }

    const medicines = prescription.medicines.filter((m) => m.name.trim());
    if (medicines.length === 0) {
      Alert.alert('Error', 'Please add at least one medicine');
      return;
    }

    const prescriptionText = `💊 Prescription\n\n📋 Diagnosis: ${prescription.diagnosis}\n\n💊 Medicines:\n${medicines
      .map((m) => `• ${m.name} - ${m.dosage} (${m.duration})`)
      .join('\n')}\n\n📝 Notes: ${prescription.notes || 'None'}`;

    await sendMessage(prescriptionText, 'prescription', prescription);

    setPrescriptionModal(false);
    setPrescription({
      diagnosis: '',
      medicines: [{ name: '', dosage: '', duration: '' }],
      notes: '',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId?._id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMyMessage && <Text style={styles.senderName}>{item.senderId?.name || 'User'}</Text>}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {item.messageType === 'prescription' && (
            <View style={styles.prescriptionBadge}>
              <Icon name="pill" size={14} color="#16a34a" />
              <Text style={styles.prescriptionBadgeText}>Prescription</Text>
            </View>
          )}

          <Text style={[styles.messageText, !isMyMessage && styles.otherMessageText]}>
            {item.content}
          </Text>

          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {appointment && (
        <View style={styles.appointmentBar}>
          <Icon name="calendar" size={16} color="#16a34a" />
          <Text style={styles.appointmentText}>
            Appointment on {appointment.date} at {appointment.time}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        {isDoctor && (
          <TouchableOpacity
            style={styles.prescriptionButton}
            onPress={() => setPrescriptionModal(true)}
          >
            <Icon name="pill" size={24} color="#16a34a" />
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, isDoctor && styles.inputWithButton]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          multiline
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Prescription Modal */}
      <Modal visible={prescriptionModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Prescription</Text>
              <TouchableOpacity onPress={() => setPrescriptionModal(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Diagnosis *</Text>
              <TextInput
                style={styles.modalInput}
                value={prescription.diagnosis}
                onChangeText={(text) => setPrescription((prev) => ({ ...prev, diagnosis: text }))}
                placeholder="Enter diagnosis"
                multiline
              />

              <Text style={styles.modalLabel}>Medicines *</Text>
              {prescription.medicines.map((med, index) => (
                <View key={index} style={styles.medicineCard}>
                  <TextInput
                    style={styles.medicineInput}
                    placeholder="Medicine name"
                    value={med.name}
                    onChangeText={(text) => updateMedicine(index, 'name', text)}
                  />
                  <TextInput
                    style={styles.medicineInput}
                    placeholder="Dosage (e.g., 500mg)"
                    value={med.dosage}
                    onChangeText={(text) => updateMedicine(index, 'dosage', text)}
                  />
                  <TextInput
                    style={styles.medicineInput}
                    placeholder="Duration (e.g., 7 days)"
                    value={med.duration}
                    onChangeText={(text) => updateMedicine(index, 'duration', text)}
                  />
                  {prescription.medicines.length > 1 && (
                    <TouchableOpacity onPress={() => removeMedicine(index)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addMedicineButton} onPress={addMedicine}>
                <Icon name="plus" size={16} color="#16a34a" />
                <Text style={styles.addMedicineText}>Add Medicine</Text>
              </TouchableOpacity>

              <Text style={styles.modalLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={prescription.notes}
                onChangeText={(text) => setPrescription((prev) => ({ ...prev, notes: text }))}
                placeholder="Optional notes"
                multiline
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setPrescriptionModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSendButton} onPress={sendPrescription}>
                <Text style={styles.modalSendText}>Send Prescription</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appointmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7e6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  appointmentText: { fontSize: 12, color: '#16a34a' },
  messagesList: { padding: 16, paddingBottom: 20 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end' },
  otherMessage: { alignSelf: 'flex-start' },
  senderName: { fontSize: 11, color: '#64748b', marginBottom: 2, marginLeft: 8 },
  messageBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  myBubble: { backgroundColor: '#16a34a', borderTopRightRadius: 4 },
  otherBubble: { backgroundColor: '#fff', borderTopLeftRadius: 4, elevation: 1 },
  messageText: { fontSize: 14, color: '#fff' },
  otherMessageText: { color: '#1e293b' },
  messageTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, alignSelf: 'flex-end' },
  prescriptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  prescriptionBadgeText: { fontSize: 10, color: '#16a34a', fontWeight: '500' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'flex-end' },
  prescriptionButton: { padding: 8, marginRight: 4 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 14, color: '#1e293b' },
  inputWithButton: { marginLeft: 4 },
  sendButton: { backgroundColor: '#16a34a', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendButtonDisabled: { backgroundColor: '#cbd5e1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalBody: { padding: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  medicineCard: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12 },
  medicineInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 10, fontSize: 14, marginBottom: 8 },
  removeText: { color: '#ef4444', fontSize: 12, textAlign: 'right', marginTop: 4 },
  addMedicineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, marginBottom: 16, gap: 8 },
  addMedicineText: { color: '#16a34a', fontSize: 14, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12 },
  modalCancelButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  modalCancelText: { color: '#64748b' },
  modalSendButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#16a34a' },
  modalSendText: { color: '#fff', fontWeight: '500' },
});

export default ChatScreen;