import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, FireIcon, Dumbbell01Icon, Activity01Icon, Time02Icon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { useUser } from '@/services/auth';
import { addNutritionLogToFirestore } from '@/services/firebase';

export default function WorkoutResultScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams();

  const calories = (params.calories as string) || '0';
  const workoutType = (params.workoutType as string) || 'Cardio';
  const intensity = (params.intensity as string) || 'Medium';
  const duration = (params.duration as string) || '30';

  const [isLogging, setIsLogging] = useState(false);

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleLog = async () => {
    if (isLogging) return;
    setIsLogging(true);

    try {
      const calValue = parseInt(calories, 10) || 0;

      if (user?.id) {
        await addNutritionLogToFirestore({
          userId: user.id,
          date: formatDateLocal(new Date()),
          name: `${workoutType} (${intensity}, ${duration} min)`,
          calories: calValue,
          protein: 0,
          carbs: 0,
          fat: 0,
          type: 'exercise',
          exerciseType: workoutType,
          intensity: intensity,
          duration: parseInt(duration, 10) || 0,
          createdAt: Date.now(),
        });
      }

      // Redirect to Home Screen to update total calories remaining count
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('[WorkoutResult] Error logging workout:', error);
      router.replace('/(tabs)/home');
    } finally {
      setIsLogging(false);
    }
  };

  const isCardio = workoutType.toLowerCase().includes('cardio') || workoutType.toLowerCase().includes('run');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={28} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Center Section */}
      <View style={styles.centerContent}>
        {/* Fire Icon in Center */}
        <View style={styles.iconCircle}>
          <HugeiconsIcon icon={FireIcon} size={44} color={AppColors.primary} />
        </View>

        {/* 'Your Workout Burned' */}
        <Text style={styles.titleText}>Your Workout Burned</Text>

        {/* Calory count as Cals */}
        <View style={styles.calorieRow}>
          <Text style={styles.calorieNumber}>{calories}</Text>
          <Text style={styles.calorieUnit}>Cals</Text>
        </View>

        {/* Workout Details Pill */}
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <HugeiconsIcon 
              icon={isCardio ? Activity01Icon : Dumbbell01Icon} 
              size={18} 
              color={AppColors.primary} 
            />
            <Text style={styles.detailText}>{workoutType}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailItem}>
            <Text style={styles.detailText}>{intensity} Intensity</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailItem}>
            <HugeiconsIcon icon={Time02Icon} size={16} color="#64748B" />
            <Text style={styles.detailText}>{duration} min</Text>
          </View>
        </View>

        <Text style={styles.formulaNote}>
          Calculated using standard Apple Fitness & MET metabolic algorithms
        </Text>
      </View>

      {/* Bottom Log Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.logButton, isLogging && styles.logButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleLog}
          disabled={isLogging}
        >
          <Text style={styles.logButtonText}>{isLogging ? 'Logging...' : 'Log'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    height: 52,
  },
  backButton: {
    padding: 8,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(41, 143, 80, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 28,
  },
  calorieNumber: {
    fontSize: 72,
    fontWeight: '300',
    color: '#0F172A',
    letterSpacing: -1.5,
  },
  calorieUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.primary,
    marginLeft: 8,
  },
  detailsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  formulaNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  logButtonDisabled: {
    opacity: 0.7,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
