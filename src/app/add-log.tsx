import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { addNutritionLogToFirestore } from '@/services/firebase';
import { AppColors } from '@/constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon } from '@/constants/hugeicons';

export default function AddLogScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [water, setWater] = useState('');
  
  // Format date to local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    await addNutritionLogToFirestore({
      userId: user.id,
      date: formatDateLocal(new Date()),
      name: name || 'Meal/Activity',
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      water: parseFloat(water) || 0,
      createdAt: Date.now(),
    });
    
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.largeTitle}>Add Log</Text>
        <Text style={styles.label}>Log Name</Text>
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          placeholder="e.g., Breakfast, Lunch" 
          value={name} 
          onChangeText={setName} 
        />
        
        <Text style={styles.label}>Calories (kcal)</Text>
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          placeholder="0" 
          keyboardType="numeric" 
          value={calories} 
          onChangeText={setCalories} 
        />
        
        <Text style={styles.label}>Protein (g)</Text>
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          placeholder="0" 
          keyboardType="numeric" 
          value={protein} 
          onChangeText={setProtein} 
        />
        
        <Text style={styles.label}>Carbs (g)</Text>
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          placeholder="0" 
          keyboardType="numeric" 
          value={carbs} 
          onChangeText={setCarbs} 
        />
        
        <Text style={styles.label}>Fat (g)</Text>
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          placeholder="0" 
          keyboardType="numeric" 
          value={fat} 
          onChangeText={setFat} 
        />
        
        <Text style={styles.label}>Water (Liters)</Text>
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          placeholder="0.0" 
          keyboardType="numeric" 
          value={water} 
          onChangeText={setWater} 
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Log</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  largeTitle: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 24,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
  },
  button: {
    backgroundColor: AppColors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
});
