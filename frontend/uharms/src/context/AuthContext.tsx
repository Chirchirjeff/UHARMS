// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';

export type Role = 'doctor' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  // Doctor-specific fields
  doctorId?: string;
  specialization?: string;
  bio?: string;
  departmentId?: string;
  departmentName?: string;
  consultationFee?: number;
  // Patient-specific fields
  patientId?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: {
    id: string;
    name: string;
    email: string;
    role: Role;
    token?: string;
    phone?: string;
    doctorId?: string;
    patientId?: string;
    specialization?: string;
    bio?: string;
    departmentId?: string;
    departmentName?: string;
    consultationFee?: number;
    dateOfBirth?: string;
    bloodGroup?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setMockUser: (user: User) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  getToken: () => string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  setMockUser: async () => {},
  updateUser: async () => {},
  getToken: () => null,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        console.log('Loading auth data - Token exists:', storedToken ? 'Yes' : 'No');
        console.log('Loading auth data - Token length:', storedToken?.length || 0);
        console.log('Loading auth data - User exists:', storedUser ? 'Yes' : 'No');

        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          if (parsedUser.role === 'doctor' || parsedUser.role === 'patient') {
            console.log('Loaded user from storage:', parsedUser.name, 'Role:', parsedUser.role);
            setUser(parsedUser);
            setToken(storedToken);
          } else {
            console.log('Invalid role in stored user, clearing');
            await AsyncStorage.clear();
          }
        }
      } catch (error) {
        console.log('Error loading auth data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const login = async (userData: {
    id: string;
    name: string;
    email: string;
    role: Role;
    token?: string;
    phone?: string;
    doctorId?: string;
    patientId?: string;
    specialization?: string;
    bio?: string;
    departmentId?: string;
    departmentName?: string;
    consultationFee?: number;
    dateOfBirth?: string;
    bloodGroup?: string;
  }) => {
    try {
      setLoading(true);
      
      console.log('AuthContext login received:');
      console.log('- Name:', userData.name);
      console.log('- Role:', userData.role);
      console.log('- Token exists:', userData.token ? 'Yes' : 'No');
      console.log('- Token length:', userData.token?.length || 0);

      const userToSave: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        // Doctor fields
        doctorId: userData.doctorId,
        specialization: userData.specialization,
        bio: userData.bio,
        departmentId: userData.departmentId,
        departmentName: userData.departmentName,
        consultationFee: userData.consultationFee,
        // Patient fields
        patientId: userData.patientId,
        dateOfBirth: userData.dateOfBirth,
        bloodGroup: userData.bloodGroup,
      };

      console.log('User to save:', userToSave.name, 'Role:', userToSave.role);

      setUser(userToSave);
      
      // Store token properly
      if (userData.token) {
        setToken(userData.token);
        await AsyncStorage.setItem('token', userData.token);
        console.log('Token saved to AsyncStorage');
      } else {
        console.log('No token provided in login data');
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(userToSave));
      
      console.log('Login successful, user saved');
    } catch (err) {
      console.log('Login error:', err);
      Alert.alert('Login Failed', 'Unable to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('User updated:', updatedUser.name);
      }
    } catch (error) {
      console.log('Update user error:', error);
    }
  };

  const setMockUser = async (mockUser: User) => {
    try {
      setLoading(true);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.removeItem('token');
      setUser(mockUser);
      setToken(null);
      console.log('Mock user set:', mockUser.name);
    } catch (error) {
      console.log('Mock login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setToken(null);
      console.log('User logged out - token and user cleared');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const getToken = () => {
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        setMockUser,
        updateUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};