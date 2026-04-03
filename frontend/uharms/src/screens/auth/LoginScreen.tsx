// src/screens/auth/LoginScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useContext(AuthContext);

  const [role, setRole] = useState('');
  const [showRoles, setShowRoles] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = ['Doctor', 'Patient'];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      console.log('Login response:', JSON.stringify(data, null, 2));

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Build the user object with all fields from the response
      const userData = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        phone: data.user.phone,
        // Doctor fields
        doctorId: data.user.doctorId,
        specialization: data.user.specialization,
        bio: data.user.bio,
        departmentId: data.user.departmentId,
        departmentName: data.user.departmentName,
        consultationFee: data.user.consultationFee,
        // Patient fields
        patientId: data.user.patientId,
        // IMPORTANT: Include the token!
        token: data.token,  // <-- THIS WAS MISSING!
      };

      console.log('User data to save:', userData);
      console.log('Token being passed:', data.token ? 'Yes' : 'No');

      // Save user and token in AuthContext
      await login(userData);

      Alert.alert('Login Successful', `Welcome ${data.user.name}`);
    } catch (err: any) {
      console.error('Login error:', err);
      Alert.alert('Login Failed', err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Uzima Healthcare</Text>
            <Text style={styles.subtitle}>Please Login to continue</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Select Role</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowRoles(!showRoles)}>
              <Text style={{ color: role ? '#000' : '#888' }}>{role || 'Choose your role'}</Text>
              <Icon name={showRoles ? 'chevron-up' : 'chevron-down'} size={20} />
            </TouchableOpacity>

            {showRoles && (
              <View style={styles.dropdownOptions}>
                {roles.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={styles.option}
                    onPress={() => {
                      setRole(r);
                      setShowRoles(false);
                    }}
                  >
                    <Text>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('PatientSignup')} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={{ color: '#16a34a' }}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#dbeafe', paddingHorizontal: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 200 },
  subtitle: { fontSize: 18, color: '#666' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5 },
  label: { fontSize: 18, marginBottom: 8, fontWeight: 'bold' },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 16, paddingHorizontal: 8 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderColor: 'gray', borderWidth: 1, paddingHorizontal: 8, marginBottom: 16 },
  passwordInput: { flex: 1, height: 40 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', borderColor: 'gray', borderWidth: 1, padding: 10, marginBottom: 8 },
  dropdownOptions: { borderColor: 'gray', borderWidth: 1, marginBottom: 16 },
  option: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  loginBtn: { backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});