// src/screens/DoctorListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<PatientStackParamList, 'DoctorList'>;

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  bio?: string;
  status?: string;
}

const DoctorListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { departmentId, departmentName } = route.params;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, [departmentId]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      console.log('Fetching doctors for department:', departmentId);
      
      const response = await fetch(`${BASE_URL}/departments/${departmentId}/doctors`);
      const data = await response.json();
      
      console.log('Doctors response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load doctors');
      }
      
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors from server');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorPress = (doctor: Doctor) => {
    navigation.navigate('DoctorAvailability', {
      doctorId: doctor._id,
      doctorName: doctor.name
    });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (doctors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="doctor" size={60} color="#ccc" />
        <Text style={styles.emptyText}>No doctors available in {departmentName}</Text>
        <Text style={styles.emptySubtext}>Please check back later</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#16a34a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{departmentName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleDoctorPress(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.specialization}>{item.specialization}</Text>
              {item.bio && (
                <Text style={styles.bio} numberOfLines={2}>
                  {item.bio}
                </Text>
              )}
              <View style={styles.contactRow}>
                <Icon name="email-outline" size={12} color="#94a3b8" />
                <Text style={styles.contactText}>{item.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Icon name="phone-outline" size={12} color="#94a3b8" />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#cbd5e1" />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  specialization: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 2,
    fontWeight: '500',
  },
  bio: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DoctorListScreen;