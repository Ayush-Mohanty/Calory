import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, DropletIcon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { useUser } from '@/services/auth';
import { addNutritionLogToFirestore } from '@/services/firebase';

const ML_PER_HALF_GLASS = 125;
const MAX_STEPS = 8; // 8 * 125ml = 1000ml (4 full glasses)

export default function LogWaterScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0); // 0 = empty, 1 = half glass, 2 = 1 full glass, ... 8 = 4 full glasses
  const [isLogging, setIsLogging] = useState(false);

  const totalMl = step * ML_PER_HALF_GLASS;

  const handlePlus = () => {
    if (step < MAX_STEPS) {
      setStep((prev) => prev + 1);
    }
  };

  const handleMinus = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleLogWater = async () => {
    if (step === 0 || totalMl === 0) {
      alert('Please add at least half a glass of water.');
      return;
    }

    setIsLogging(true);
    try {
      const waterLiters = totalMl / 1000;

      if (user?.id) {
        await addNutritionLogToFirestore({
          userId: user.id,
          date: formatDateLocal(new Date()),
          name: `${totalMl} ml Water`,
          calories: 0, // No calories needed
          protein: 0,
          carbs: 0,
          fat: 0,
          water: waterLiters,
          type: 'food',
          createdAt: Date.now(),
        });
      }

      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('Error logging water intake:', err);
      router.replace('/(tabs)/home');
    } finally {
      setIsLogging(false);
    }
  };

  // Compute glasses to render
  const fullGlassesCount = Math.floor(step / 2);
  const hasHalfGlass = step % 2 === 1;
  const totalGlassesCount = fullGlassesCount + (hasHalfGlass ? 1 : 0);

  const getGlassSubtitle = () => {
    if (step === 0) return 'Empty glass (0 ml)';
    if (step === 1) return 'Half glass (125 ml)';
    if (step === 2) return '1 full glass (250 ml)';
    if (step === 3) return '1.5 glasses (375 ml)';
    if (step === 4) return '2 full glasses (500 ml)';
    if (step === 5) return '2.5 glasses (625 ml)';
    if (step === 6) return '3 full glasses (750 ml)';
    if (step === 7) return '3.5 glasses (875 ml)';
    return '4 full glasses (1 Liter)';
  };

  const renderGlasses = () => {
    if (step === 0) {
      return (
        <View style={styles.singleGlassWrapper}>
          <Image
            source={require('../../assets/expo.icon/images/images/empty_glass.png')}
            style={styles.bigEmptyGlass}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (totalGlassesCount === 1) {
      return (
        <View style={styles.singleGlassWrapper}>
          <Image
            source={
              hasHalfGlass
                ? require('../../assets/expo.icon/images/images/half_glass.png')
                : require('../../assets/expo.icon/images/images/full_glass.png')
            }
            style={styles.bigSingleGlass}
            resizeMode="contain"
          />
        </View>
      );
    }

    // 2, 3, or 4 glasses display
    const glassElements = [];
    for (let i = 0; i < fullGlassesCount; i++) {
      glassElements.push(
        <Image
          key={`full-${i}`}
          source={require('../../assets/expo.icon/images/images/full_glass.png')}
          style={totalGlassesCount === 2 ? styles.mediumGlass : styles.smallGlass}
          resizeMode="contain"
        />
      );
    }

    if (hasHalfGlass) {
      glassElements.push(
        <Image
          key="half"
          source={require('../../assets/expo.icon/images/images/half_glass.png')}
          style={totalGlassesCount === 2 ? styles.mediumGlass : styles.smallGlass}
          resizeMode="contain"
        />
      );
    }

    return (
      <View style={[styles.multiGlassesWrapper, totalGlassesCount > 2 && styles.multiGlassesGrid]}>
        {glassElements}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={28} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Heading 'Add Water Intake' */}
        <Text style={styles.pageTitle}>Add Water Intake</Text>
        <Text style={styles.subtitle}>Track your daily hydration one glass at a time</Text>

        {/* Big Glass Image Display Area */}
        <View style={styles.glassDisplayCard}>
          {renderGlasses()}
          <Text style={styles.glassSubtitleText}>{getGlassSubtitle()}</Text>
        </View>

        {/* Stepper Controls: [-] total ml [+] */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.stepperBtn, step === 0 && styles.stepperBtnDisabled]}
            onPress={handleMinus}
            disabled={step === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperIconText, step === 0 && styles.stepperIconDisabled]}>−</Text>
          </TouchableOpacity>

          <View style={styles.amountDisplay}>
            <View style={styles.amountRow}>
              <Text style={styles.amountNumber}>{totalMl}</Text>
              <Text style={styles.amountUnit}>ml</Text>
            </View>
            <View style={styles.dropletBadge}>
              <HugeiconsIcon icon={DropletIcon} size={14} color="#0EA5E9" />
              <Text style={styles.dropletText}>{(totalMl / 1000).toFixed(2)} Liters</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.stepperBtn, styles.stepperPlusBtn, step === MAX_STEPS && styles.stepperBtnDisabled]}
            onPress={handlePlus}
            disabled={step === MAX_STEPS}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperIconText, styles.stepperPlusText]}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Log Water Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.logButton, (step === 0 || isLogging) && styles.logButtonDisabled]}
          onPress={handleLogWater}
          disabled={step === 0 || isLogging}
          activeOpacity={0.85}
        >
          <Text style={styles.logButtonText}>{isLogging ? 'Logging...' : 'Log Water'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    alignSelf: 'flex-start',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  glassDisplayCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 32,
    minHeight: 280,
  },
  singleGlassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  bigEmptyGlass: {
    width: 140,
    height: 190,
  },
  bigSingleGlass: {
    width: 140,
    height: 190,
  },
  multiGlassesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    height: 200,
    flexWrap: 'wrap',
  },
  multiGlassesGrid: {
    gap: 12,
  },
  mediumGlass: {
    width: 95,
    height: 145,
  },
  smallGlass: {
    width: 68,
    height: 110,
  },
  glassSubtitleText: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  stepperBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperPlusBtn: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperIconText: {
    fontSize: 30,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 32,
    textAlign: 'center',
  },
  stepperPlusText: {
    color: '#FFFFFF',
  },
  stepperIconDisabled: {
    color: '#94A3B8',
  },
  amountDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  amountNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  amountUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0EA5E9',
    marginLeft: 6,
  },
  dropletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dropletText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  logButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  logButtonDisabled: {
    opacity: 0.5,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
