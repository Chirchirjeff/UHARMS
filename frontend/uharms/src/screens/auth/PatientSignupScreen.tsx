// src/screens/auth/PatientSignupScreen.tsx
import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from "../../navigation/types";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config/api";

type Props = NativeStackScreenProps<AuthStackParamList, 'PatientSignup'>;

const PatientSignupScreen = ({ navigation }: Props) => {
  const { login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Additional patient fields
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1)); // Default to Jan 1, 2000 for easier selection
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Validate phone (basic validation)
    if (phone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          phone: phone.trim(), 
          password: password.trim(),
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          bloodGroup: bloodGroup || undefined,
          allergies: allergies.split(',').map(a => a.trim()).filter(a => a),
          emergencyContact: emergencyName ? {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRelation
          } : undefined
        })
      });

      const data = await response.json();
      console.log("Signup response:", JSON.stringify(data, null, 2));

      if (response.ok) {
        const userData = data.user;
        
        const userForContext = {
          id: userData.id || userData._id,
          name: userData.name,
          email: userData.email,
          role: "patient" as const,
          phone: userData.phone,
          patientId: userData.patientId,
        };

        await login({
          ...userForContext,
          token: data.token
        });
        
        Alert.alert("Success", "Account created successfully! Welcome to UHARMS");
      } else {
        Alert.alert("Error", data.message || data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  // Updated date picker handler - using the new API
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  // For iOS, we need to handle the dismiss separately
  const onDatePickerDismiss = () => {
    setShowDatePicker(false);
  };

  // Function to open date picker with better UX
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={24} color="#16a34a" />
      </TouchableOpacity>

      <Text style={styles.title}>Patient Sign Up</Text>
      <Text style={styles.subtitle}>Create your account to get started</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Full Name *"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <TextInput
          placeholder="Email *"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          placeholder="Phone Number *"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password * (min 6 characters)"
            placeholderTextColor="#94a3b8"
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Date of Birth - Improved */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date of Birth *</Text>
          <TouchableOpacity style={styles.dateSelector} onPress={openDatePicker}>
            <Ionicons name="calendar" size={20} color="#16a34a" />
            <Text style={styles.dateText}>
              {formatDate(dateOfBirth)}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" style={styles.dateChevron} />
          </TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            onDismiss={onDatePickerDismiss}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}

        {/* Blood Group */}
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Blood Group (Optional)</Text>
          <View style={styles.bloodGroupRow}>
            {bloodGroups.map(group => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.bloodGroupOption,
                  bloodGroup === group && styles.bloodGroupSelected
                ]}
                onPress={() => setBloodGroup(group)}
              >
                <Text style={[
                  styles.bloodGroupText,
                  bloodGroup === group && styles.bloodGroupTextSelected
                ]}>{group}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <TextInput
          placeholder="Allergies (comma separated, e.g., Penicillin, Pollen)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={allergies}
          onChangeText={setAllergies}
          editable={!loading}
        />

        <Text style={styles.sectionTitle}>Emergency Contact (Optional)</Text>
        
        <TextInput
          placeholder="Contact Name"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={emergencyName}
          onChangeText={setEmergencyName}
          editable={!loading}
        />

        <TextInput
          placeholder="Contact Phone"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <TextInput
          placeholder="Relationship (e.g., Spouse, Parent)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={emergencyRelation}
          onChangeText={setEmergencyRelation}
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  dateChevron: {
    marginLeft: 'auto',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  bloodGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  bloodGroupSelected: {
    backgroundColor: '#16a34a',
  },
  bloodGroupText: {
    fontSize: 14,
    color: '#1e293b',
  },
  bloodGroupTextSelected: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLinkHighlight: {
    color: '#16a34a',
    fontWeight: '600',
  },
});

export default PatientSignupScreen;