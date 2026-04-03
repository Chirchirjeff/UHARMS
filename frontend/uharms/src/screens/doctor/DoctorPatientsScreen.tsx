import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { DoctorStackParamList } from '../../navigation/types';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit?: string;
  appointmentCount?: number;
}

const DoctorPatientsScreen = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use doctorId from user object, not user.id
  const doctorId = (user as any)?.doctorId || user?.id;

  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    } else {
      console.log('No doctor ID available');
      setLoading(false);
    }
  }, [doctorId]);

  const fetchPatients = async () => {
    if (!doctorId) return;
    
    try {
      console.log('Fetching patients for doctor:', doctorId);
      const response = await fetch(`${BASE_URL}/doctors/${doctorId}/patients`);
      const data = await response.json();
      console.log('Patients response:', data);
      
      if (response.ok) {
        setPatients(data);
      } else {
        console.log('Error response:', data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const handlePatientPress = (patientId: string) => {
    navigation.navigate('DoctorPatientDetail', { patientId });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No visits yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePatientPress(item._id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientContact}>{item.email}</Text>
        <Text style={styles.patientContact}>{item.phone}</Text>
        {item.lastVisit && (
          <View style={styles.lastVisitBadge}>
            <Icon name="calendar" size={12} color="#16a34a" />
            <Text style={styles.lastVisitText}>Last visit: {formatDate(item.lastVisit)}</Text>
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={20} color="#94a3b8" />
    </TouchableOpacity>
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
      <Text style={styles.title}>My Patients</Text>
      
      <FlatList
        data={patients}
        keyExtractor={(item) => item._id}
        renderItem={renderPatient}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No Patients Yet</Text>
            <Text style={styles.emptyText}>
              When patients book appointments with you,{'\n'}
              they will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  patientContact: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  lastVisitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  lastVisitText: {
    fontSize: 11,
    color: '#16a34a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default DoctorPatientsScreen;