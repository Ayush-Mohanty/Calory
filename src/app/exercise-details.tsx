import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, KeyboardAvoidingView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, FireIcon, Calendar03Icon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [duration, setDuration] = useState<string>(''); // empty by default so user can type
  const [activeChip, setActiveChip] = useState<string>(''); // tracks which chip is selected

  const slideAnim = useRef(new Animated.Value(1)).current; // Starts at Medium (1)

  useEffect(() => {
    let toValue = 1;
    if (intensity === 'Low') toValue = 0;
    if (intensity === 'High') toValue = 2;

    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false, // percentage left needs false
      friction: 8,
      tension: 80,
    }).start();
  }, [intensity]);

  const exerciseType = (type as string) || 'Cardio';
  const description = exerciseType === 'Cardio' 
    ? 'Running, Walking, Cycling, etc.'
    : 'Gym, Machines, Free Weights, etc.';

  const handleChipPress = (val: string) => {
    setDuration(val);
    setActiveChip(val);
  };

  const handleTextChange = (text: string) => {
    setDuration(text);
    setActiveChip(''); // deselect chip if manual typing
  };

  const handleContinue = () => {
    if (!duration) {
      alert('Please select or enter a duration.');
      return;
    }
    // For now, alert success and go back to home
    alert(`Logged ${duration} min of ${intensity} intensity ${exerciseType}!`);
    router.replace('/home');
  };

  const animatedThumbStyle = {
    left: slideAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['0%', '50%', '100%']
    }),
    transform: [{
      translateX: slideAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, -12, -24]
      })
    }]
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.largeTitle}>{exerciseType}</Text>
          <Text style={styles.descriptionText}>{description}</Text>

          {/* Intensity Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <HugeiconsIcon icon={FireIcon} size={20} color="#EF4444" />
              <Text style={styles.cardTitle}>Intensity</Text>
            </View>
            
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack} />
              <Animated.View style={[styles.sliderThumb, animatedThumbStyle]} />
              
              <View style={styles.touchAreas}>
                <TouchableOpacity style={styles.touchArea} onPress={() => setIntensity('Low')} />
                <TouchableOpacity style={styles.touchArea} onPress={() => setIntensity('Medium')} />
                <TouchableOpacity style={styles.touchArea} onPress={() => setIntensity('High')} />
              </View>
            </View>
            
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabelText, intensity === 'Low' && styles.activeLabel]}>Low</Text>
              <Text style={[styles.sliderLabelText, intensity === 'Medium' && styles.activeLabel]}>Medium</Text>
              <Text style={[styles.sliderLabelText, intensity === 'High' && styles.activeLabel]}>High</Text>
            </View>
          </View>

          {/* Duration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <HugeiconsIcon icon={Calendar03Icon} size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Duration</Text>
            </View>
            
            <View style={styles.chipsContainer}>
              {['15', '30', '60', '90'].map((val) => {
                const isActive = activeChip === val;
                return (
                  <TouchableOpacity 
                    key={val} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => handleChipPress(val)}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                      {val} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.manualEntryLabel}>Or enter manually (minutes):</Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g. 45"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={duration}
              onChangeText={handleTextChange}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Premium light mode background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Make room for bottom bar
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Slider Styles
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    width: '100%',
    borderRadius: 3,
    position: 'absolute',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  touchAreas: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  touchArea: {
    flex: 1,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    width: 60,
    textAlign: 'center',
  },
  activeLabel: {
    color: '#0F172A',
    fontWeight: '700',
  },
  // Duration Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChip: {
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderColor: AppColors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeChipText: {
    color: AppColors.primary,
  },
  manualEntryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  continueButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
