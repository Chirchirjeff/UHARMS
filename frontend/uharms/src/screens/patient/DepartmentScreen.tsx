// src/screens/DepartmentScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DepartmentCard from '../../components/layout/DepartmentCard.tsx';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types.ts'; // Change this import
import { BASE_URL } from '../../config/api.js';

// Change to PatientStackParamList
type DepartmentScreenProps = NativeStackScreenProps<PatientStackParamList, 'Department'>;

interface Department {
  _id: string;
  name: string;
  description: string;
  icon: string;
}

const DepartmentScreen = ({ navigation }: DepartmentScreenProps) => {
  const insets = useSafeAreaInsets();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/departments`)
      .then(res => res.json())
      .then(data => {
        setDepartments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching departments:", err);
        Alert.alert("Error", "Failed to load departments from server.");
        setLoading(false);
      });
  }, []);

  const handleDepartmentPress = (department: Department) => {
    navigation.navigate('DoctorList', { 
      departmentId: department._id, 
      departmentName: department.name 
    });
  };

  const renderItem = ({ item }: { item: Department }) => (
    <DepartmentCard
      department={item}
      onPress={() => handleDepartmentPress(item)}
    />
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (departments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No departments found.</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.title}>Departments</Text>

      <FlatList
        data={departments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#333' },
});

export default DepartmentScreen;