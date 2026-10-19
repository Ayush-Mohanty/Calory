import { AppColors } from '@/constants/colors';
import { ArrowLeft02Icon, FireIcon } from '@/constants/hugeicons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUser } from '@clerk/expo';
import { addNutritionLogToFirestore } from '@/services/firebase';

export default function ManualLogScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [calories, setCalories] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleLog = async () => {
    if (!calories) {
      alert('Please enter calories burned.');
      return;
    }
    const calValue = parseInt(calories, 10);
    if (isNaN(calValue) || calValue <= 0) {
      alert('Please enter a valid calorie amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user?.id) {
        await addNutritionLogToFirestore({
          userId: user.id,
          date: formatDateLocal(new Date()),
          name: description.trim() || 'Manual Exercise',
          calories: calValue,
          protein: 0,
          carbs: 0,
          fat: 0,
          createdAt: Date.now(),
        });
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      console.error('Error logging manual calories:', err);
      router.replace('/(tabs)/home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <HugeiconsIcon icon={ArrowLeft02Icon} size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manual Entry</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.centerSection}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={FireIcon} size={40} color={AppColors.primary} />
            </View>
            <Text style={styles.questionText}>How many calories did you burn?</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.giantInput}
                placeholder="0"
                placeholderTextColor="#373f3bff"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
                autoFocus
                maxLength={4}
              />
              <Text style={styles.kcalText}>Cal</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.descInput}
              placeholder="e.g. Hiking, Yoga class..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
            />
          </View>

        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.logButton, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleLog}
            disabled={isSubmitting}
          >
            <Text style={styles.logButtonText}>{isSubmitting ? 'Logging...' : 'Log Calories'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  centerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giantInput: {
    fontSize: 72,
    fontWeight: '300',
    color: '#0F172A',
    padding: 0,
    marginRight: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  kcalText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16, // optically align baseline with the giant numbers
  },
  descriptionSection: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 16,
  },
  descInput: {
    fontSize: 16,
    color: '#0F172A',
    padding: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bottomBar: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  logButton: {
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
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
