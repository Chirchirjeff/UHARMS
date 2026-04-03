import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TopNAvProp =  NativeStackNavigationProp<RootStackParamList>;

const TopNav = () => {
  const navigation = useNavigation<TopNAvProp>();
  const insets = useSafeAreaInsets();

  return(
    <View style= {[styles.container, {paddingTop: insets.top}]}>
      <TouchableOpacity 
      style= {styles.navItem1}
      onPress={() => navigation.navigate('Department')}>
        <Text style= {styles.link}>Appointment</Text>
      </TouchableOpacity>

      <TouchableOpacity 
      style= {styles.navItem2}
      onPress= {() => navigation.navigate('Login')}>
        <Text style= {styles.link}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
container: {
  backgroundColor: '#333',
  flexDirection: 'row',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
  paddingVertical: 8, // flexible height
},

  link: {
    fontSize: 16,
    fontWeight: '600',
  },
  navItem1: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#098229',
    borderRadius: 8,
    marginRight: 20,
    marginLeft: 50,
    borderColor: 'black'
  },
   navItem2: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#87cefa',
    borderRadius: 8,
    marginRight: 20,
    marginLeft: 20,
    borderColor: 'black'
  }
});

export default TopNav;