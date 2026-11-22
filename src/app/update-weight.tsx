import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, CheckmarkCircle02Icon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { RulerPicker } from '@/components/RulerPicker';
import { useUser } from '@/services/auth';
import {
  getUserWeight,
  saveUserWeight,
  saveWeightLogLocally,
} from '@/services/storage';
import { saveWeightUpdateToFirestore } from '@/services/firebase';

const { width } = Dimensions.get('window');

export default function UpdateWeightScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [selectedWeight, setSelectedWeight] = useState<number>(70);
  const [initialWeight, setInitialWeight] = useState<number>(70);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchWeight() {
      try {
        const stored = await getUserWeight();
        if (stored && stored > 0) {
          const rounded = Math.round(stored);
          const clamped = Math.max(30, Math.min(250, rounded));
          setSelectedWeight(clamped);
          setInitialWeight(clamped);
        } else {
          setSelectedWeight(70);
          setInitialWeight(70);
        }
      } catch (err) {
        console.error('[UpdateWeight] Error loading weight:', err);
        setSelectedWeight(70);
        setInitialWeight(70);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchWeight();
  }, []);

  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleUpdateWeight = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const todayStr = formatDateLocal(new Date());
      const weightVal = Math.round(selectedWeight * 10) / 10;

      // 1. Save weight in local storage & onboarding profile
      await saveUserWeight(weightVal);

      // 2. Add time-series record to local history for future analytics graphs
      await saveWeightLogLocally({
        weightKg: weightVal,
        date: todayStr,
        timestamp: Date.now(),
      });

      // 3. Update Firestore (user document & weightLogs collection)
      if (user?.id) {
        await saveWeightUpdateToFirestore(user.id, weightVal, todayStr);
      }

      router.back();
    } catch (error) {
      console.error('[UpdateWeight] Failed to update weight:', error);
      Alert.alert('Error', 'Unable to update weight right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Soft gradient background matching reference design */}
      <LinearGradient
        colors={['#DCFCE7', '#F0FDF4', '#FFFFFF']}
        locations={[0, 0.28, 0.65]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Weight</Text>
      </View>

      {/* Center Ruler Picker Area */}
      <View style={styles.centerContainer}>
        {isLoaded ? (
          <RulerPicker
            min={30}
            max={250}
            step={1}
            fractionDigits={0}
            initialValue={initialWeight}
            unit="kg"
            width={width}
            height={110}
            indicatorHeight={72}
            indicatorColor={AppColors.primary}
            shortStepColor="#CBD5E1"
            longStepColor="#94A3B8"
            shortStepHeight={18}
            longStepHeight={36}
            stepWidth={2}
            gapBetweenSteps={14}
            valueTextStyle={{
              fontSize: 64,
              fontWeight: '800',
              color: '#0F172A',
            }}
            unitTextStyle={{
              fontSize: 22,
              fontWeight: '700',
              color: '#475569',
            }}
            onValueChange={(val) => {
              const num = parseFloat(val);
              if (!isNaN(num)) setSelectedWeight(num);
            }}
            onValueChangeEnd={(val) => {
              const num = parseFloat(val);
              if (!isNaN(num)) setSelectedWeight(num);
            }}
          />
        ) : (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        )}
      </View>

      {/* Bottom Update Weight Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.updateButton, isSaving && styles.updateButtonDisabled]}
          onPress={handleUpdateWeight}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.buttonContent}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="#FFFFFF" />
              <Text style={styles.buttonText}>Update Weight</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 12,
    paddingTop: 12,
  },
  updateButton: {
    backgroundColor: AppColors.primary,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
  },
});
