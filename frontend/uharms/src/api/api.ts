// src/api/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';

/* =====================
   Axios instance
===================== */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* =====================
   Request interceptor to attach token
===================== */
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.log('Error getting token:', err);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/* =====================
   Response interceptor
===================== */
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.log("API STATUS:", error.response.status);
      console.log("API DATA:", error.response.data);
    } else if (error.request) {
      console.log("No response received from server");
    } else {
      console.log("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);