import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, Activity01Icon, Dumbbell01Icon, Edit02Icon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogExerciseScreen() {
  const router = useRouter();

  const handleOptionPress = (type: string) => {
    // For now, these can route to a generic manual entry or specific screens later
    // Let's just go to the manual add-log screen or alert for now
    if (type === 'manual') {
      router.push('/manual-log');
    } else {
      router.push(`/exercise-details?type=${type}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.largeTitle}>Log Exercise</Text>

        <View style={styles.optionsContainer}>
          {/* Option 1: Run */}
          <TouchableOpacity 
            style={styles.optionCard} 
            activeOpacity={0.7}
            onPress={() => handleOptionPress('Cardio')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <HugeiconsIcon icon={Activity01Icon} size={28} color="#3B82F6" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Cardio</Text>
              <Text style={styles.optionDescription}>Running, Walking, Cycling, etc.</Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Weight Lifting */}
          <TouchableOpacity 
            style={styles.optionCard} 
            activeOpacity={0.7}
            onPress={() => handleOptionPress('Strength')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <HugeiconsIcon icon={Dumbbell01Icon} size={28} color="#F59E0B" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Weight Lifting</Text>
              <Text style={styles.optionDescription}>Gym, Machines, Free Weights, etc.</Text>
            </View>
          </TouchableOpacity>

          {/* Option 3: Manual */}
          <TouchableOpacity 
            style={styles.optionCard} 
            activeOpacity={0.7}
            onPress={() => handleOptionPress('manual')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <HugeiconsIcon icon={Edit02Icon} size={28} color="#10B981" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Manual</Text>
              <Text style={styles.optionDescription}>Enter calories burned manually.</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
