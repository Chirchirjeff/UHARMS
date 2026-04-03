// src/screens/LandingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types'; // Change this import

type LandingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Landing'>; // Change to AuthStackParamList

const LogoImg = require('../../assets/images/logo.png');
const { width } = Dimensions.get('window');

const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>

      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image source={LogoImg} style={styles.logoImg} />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.headerText}>Welcome to Uzima Healthcare</Text>
        <Text style={styles.subText}>
          We provide:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={styles.bullet}>• Access to certified doctors</Text>
          <Text style={styles.bullet}>• Affordable healthcare services</Text>
          <Text style={styles.bullet}>• 24/7 appointment booking</Text>
          <Text style={styles.bullet}>• Reliable and convenient care</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login (Existing Users)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('PatientSignup')} // Change from 'Signup' to 'PatientSignup'
        >
          <Text style={styles.buttonText}>Book Appointment (New Users)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#059733',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoImg: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    borderRadius: 60,
  },
  welcomeSection: {
    marginTop: 30,
    width: width * 0.85,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059733',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  bulletPoints: {
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  buttonsContainer: {
    marginTop: 40,
    width: width * 0.85,
  },
  loginButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  bookButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  buttonText: {
    color: '#059733',
    fontWeight: 'bold',
    fontSize: 16,
  },
});