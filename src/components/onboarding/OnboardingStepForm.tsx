import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon,
  FavouriteIcon,
  UserGroupIcon,
  FireIcon,
  Activity01Icon,
  Dumbbell01Icon,
  EnergyIcon,
  FlashIcon,
  Dumbbell02Icon,
  Calendar03Icon,
  RulerIcon,
  WeightScale01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  Tick02Icon,
} from '@/constants/hugeicons';

import { AppColors } from '@/constants/colors';
import { OnboardingData } from '@/services/storage';

interface OnboardingStepFormProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  initialName?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const OnboardingStepForm: React.FC<OnboardingStepFormProps> = ({
  onComplete,
  initialName = '',
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Step 1: Gender
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);

  // Step 2: Goal
  const [goal, setGoal] = useState<'lose_weight' | 'maintain' | 'gain_weight' | null>(null);

  // Step 3: Workout detail
  const [workoutDays, setWorkoutDays] = useState<'2-3_days' | '3-4_days' | '5-6_days' | null>(null);

  // Step 4: Birthdate
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(6); // 1-indexed (June)
  const [birthYear, setBirthYear] = useState<number>(1998);

  // Step 5: Height & Weight (Feet and Kg)
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);
  const [weightKg, setWeightKg] = useState<number>(70);

  // Calculate age
  const calculateAge = (): number => {
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() + 1 - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
      age--;
    }
    return age > 0 ? age : 0;
  };

  // Calculate BMI
  const calculateBMI = (): { bmi: string; label: string; color: string } => {
    const totalInches = heightFeet * 12 + heightInches;
    const heightInMeters = totalInches * 0.0254;
    if (heightInMeters <= 0 || weightKg <= 0) return { bmi: '--', label: 'Normal', color: AppColors.primary };
    const bmiVal = weightKg / (heightInMeters * heightInMeters);
    const rounded = bmiVal.toFixed(1);
    if (bmiVal < 18.5) return { bmi: rounded, label: 'Underweight', color: AppColors.info };
    if (bmiVal < 25) return { bmi: rounded, label: 'Healthy Weight', color: AppColors.primary };
    if (bmiVal < 30) return { bmi: rounded, label: 'Overweight', color: AppColors.warning };
    return { bmi: rounded, label: 'Higher BMI', color: AppColors.error };
  };

  // Determine if next button is enabled
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return gender !== null;
      case 2:
        return goal !== null;
      case 3:
        return workoutDays !== null;
      case 4:
        return calculateAge() >= 13 && calculateAge() <= 100;
      case 5:
        return heightFeet >= 3 && heightFeet <= 7 && weightKg >= 30 && weightKg <= 250;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!isStepValid() || loading) return;

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Step 5 completed - Save profile!
      setLoading(true);
      try {
        const onboardingPayload: OnboardingData = {
          gender: gender!,
          goal: goal!,
          workoutDays: workoutDays!,
          birthDate: {
            day: birthDay,
            month: birthMonth,
            year: birthYear,
          },
          heightFeet,
          heightInches,
          weightKg,
          completedAt: Date.now(),
        };
        await onComplete(onboardingPayload);
      } catch (error) {
        console.error('Error completing onboarding:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const progressPercentage = (currentStep / 5) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Top Header & Progress Bar */}
        <View style={styles.header}>
          <View style={styles.headerNav}>
            {currentStep > 1 ? (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}>
                <HugeiconsIcon icon={ArrowLeft02Icon} size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step {currentStep} of 5</Text>
            </View>

            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{progressPercentage}%</Text>
            </View>
          </View>

          {/* Animated Progress Track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Dynamic Step Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* STEP 1: Select Gender */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select your gender</Text>
              <Text style={styles.stepSubtitle}>
                This helps us calibrate your basal metabolic rate and body composition targets.
              </Text>

              <View style={styles.optionsList}>
                {/* Male Card */}
                <TouchableOpacity
                  style={[styles.cardOption, gender === 'male' && styles.cardOptionSelected]}
                  onPress={() => setGender('male')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, gender === 'male' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={UserIcon}
                      size={28}
                      color={gender === 'male' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Male</Text>
                    <Text style={styles.cardSubtitle}>Standard male calorie baseline formula</Text>
                  </View>
                  {gender === 'male' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Female Card */}
                <TouchableOpacity
                  style={[styles.cardOption, gender === 'female' && styles.cardOptionSelected]}
                  onPress={() => setGender('female')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, gender === 'female' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={FavouriteIcon}
                      size={28}
                      color={gender === 'female' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Female</Text>
                    <Text style={styles.cardSubtitle}>Standard female calorie baseline formula</Text>
                  </View>
                  {gender === 'female' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Other Card */}
                <TouchableOpacity
                  style={[styles.cardOption, gender === 'other' && styles.cardOptionSelected]}
                  onPress={() => setGender('other')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, gender === 'other' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      size={28}
                      color={gender === 'other' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Other / Prefer not to say</Text>
                    <Text style={styles.cardSubtitle}>Balanced metabolic baseline calculation</Text>
                  </View>
                  {gender === 'other' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: Goal Selection */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What's your primary goal?</Text>
              <Text style={styles.stepSubtitle}>
                Calory AI will calculate your specific caloric intake and macros based on this.
              </Text>

              <View style={styles.optionsList}>
                {/* Lose Weight */}
                <TouchableOpacity
                  style={[styles.cardOption, goal === 'lose_weight' && styles.cardOptionSelected]}
                  onPress={() => setGoal('lose_weight')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, goal === 'lose_weight' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={FireIcon}
                      size={28}
                      color={goal === 'lose_weight' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Lose Weight</Text>
                    <Text style={styles.cardSubtitle}>Burn body fat, get leaner, and build healthy habits</Text>
                  </View>
                  {goal === 'lose_weight' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Maintain Weight */}
                <TouchableOpacity
                  style={[styles.cardOption, goal === 'maintain' && styles.cardOptionSelected]}
                  onPress={() => setGoal('maintain')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, goal === 'maintain' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={Activity01Icon}
                      size={28}
                      color={goal === 'maintain' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Maintain Weight</Text>
                    <Text style={styles.cardSubtitle}>Stay fit, preserve physique, and optimize daily energy</Text>
                  </View>
                  {goal === 'maintain' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Gain Weight */}
                <TouchableOpacity
                  style={[styles.cardOption, goal === 'gain_weight' && styles.cardOptionSelected]}
                  onPress={() => setGoal('gain_weight')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, goal === 'gain_weight' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={Dumbbell01Icon}
                      size={28}
                      color={goal === 'gain_weight' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Gain Weight & Muscle</Text>
                    <Text style={styles.cardSubtitle}>Build lean muscle mass with surplus energy</Text>
                  </View>
                  {goal === 'gain_weight' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Workout detail */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>How often do you exercise?</Text>
              <Text style={styles.stepSubtitle}>
                Select your regular weekly activity to estimate your Total Daily Energy Expenditure (TDEE).
              </Text>

              <View style={styles.optionsList}>
                {/* 2-3 Days */}
                <TouchableOpacity
                  style={[styles.cardOption, workoutDays === '2-3_days' && styles.cardOptionSelected]}
                  onPress={() => setWorkoutDays('2-3_days')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, workoutDays === '2-3_days' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={EnergyIcon}
                      size={28}
                      color={workoutDays === '2-3_days' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>2 - 3 Days / week</Text>
                    <Text style={styles.cardSubtitle}>Light activity — occasional workouts, walking, yoga</Text>
                  </View>
                  {workoutDays === '2-3_days' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* 3-4 Days */}
                <TouchableOpacity
                  style={[styles.cardOption, workoutDays === '3-4_days' && styles.cardOptionSelected]}
                  onPress={() => setWorkoutDays('3-4_days')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, workoutDays === '3-4_days' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={FlashIcon}
                      size={28}
                      color={workoutDays === '3-4_days' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>3 - 4 Days / week</Text>
                    <Text style={styles.cardSubtitle}>Moderate activity — regular gym sessions, running, sports</Text>
                  </View>
                  {workoutDays === '3-4_days' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* 5-6 Days */}
                <TouchableOpacity
                  style={[styles.cardOption, workoutDays === '5-6_days' && styles.cardOptionSelected]}
                  onPress={() => setWorkoutDays('5-6_days')}
                  activeOpacity={0.8}>
                  <View style={[styles.iconContainer, workoutDays === '5-6_days' && styles.iconContainerSelected]}>
                    <HugeiconsIcon
                      icon={Dumbbell02Icon}
                      size={28}
                      color={workoutDays === '5-6_days' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>5 - 6 Days / week</Text>
                    <Text style={styles.cardSubtitle}>Very active — intense weightlifting, athlete routine, HIIT</Text>
                  </View>
                  {workoutDays === '5-6_days' && (
                    <View style={styles.checkIconWrap}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color={AppColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: Birthdate */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>When were you born?</Text>
              <Text style={styles.stepSubtitle}>
                Age influences your metabolism and daily nutritional balance.
              </Text>

              <View style={styles.dateHeroCard}>
                <View style={styles.dateHeroIcon}>
                  <HugeiconsIcon icon={Calendar03Icon} size={36} color={AppColors.primary} />
                </View>
                <Text style={styles.dateHeroAge}>{calculateAge()} Years Old</Text>
                <Text style={styles.dateHeroSubtitle}>
                  {MONTHS[birthMonth - 1]} {birthDay}, {birthYear}
                </Text>
              </View>

              <View style={styles.datePickersRow}>
                {/* Day Input */}
                <View style={styles.datePickerBox}>
                  <Text style={styles.datePickerLabel}>Day</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      onPress={() => setBirthDay((d) => Math.max(1, d - 1))}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
                      value={birthDay.toString()}
                      onChangeText={(t) => {
                        const val = parseInt(t) || 1;
                        if (val >= 1 && val <= 31) setBirthDay(val);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TouchableOpacity
                      onPress={() => setBirthDay((d) => Math.min(31, d + 1))}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Month Input */}
                <View style={styles.datePickerBox}>
                  <Text style={styles.datePickerLabel}>Month</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      onPress={() => setBirthMonth((m) => (m === 1 ? 12 : m - 1))}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthDisplay}>{MONTHS[birthMonth - 1]?.slice(0, 3)}</Text>
                    <TouchableOpacity
                      onPress={() => setBirthMonth((m) => (m === 12 ? 1 : m + 1))}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Year Input */}
                <View style={styles.datePickerBox}>
                  <Text style={styles.datePickerLabel}>Year</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      onPress={() => setBirthYear((y) => Math.max(1940, y - 1))}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
                      value={birthYear.toString()}
                      onChangeText={(t) => {
                        const val = parseInt(t) || 1990;
                        if (val >= 1940 && val <= 2015) setBirthYear(val);
                      }}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                    <TouchableOpacity
                      onPress={() => setBirthYear((y) => Math.min(2013, y + 1))}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 5: Height and Weight (Feet and Kg) */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Height & Weight</Text>
              <Text style={styles.stepSubtitle}>
                Enter your height in Feet and your weight in Kilograms.
              </Text>

              {/* Height Card (Feet and Inches) */}
              <View style={styles.measurementCard}>
                <View style={styles.measurementHeader}>
                  <View style={styles.measurementIconWrap}>
                    <HugeiconsIcon icon={RulerIcon} size={22} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.measurementTitle}>Height</Text>
                    <Text style={styles.measurementSubtitle}>in Feet & Inches</Text>
                  </View>
                  <View style={styles.measurementValueTag}>
                    <Text style={styles.measurementValueText}>
                      {heightFeet} ft {heightInches} in
                    </Text>
                  </View>
                </View>

                {/* Feet Picker */}
                <View style={styles.pillSelectorRow}>
                  <Text style={styles.selectorSublabel}>Feet:</Text>
                  {[4, 5, 6, 7].map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.pillBtn, heightFeet === ft && styles.pillBtnSelected]}
                      onPress={() => setHeightFeet(ft)}>
                      <Text style={[styles.pillBtnText, heightFeet === ft && styles.pillBtnTextSelected]}>
                        {ft} ft
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Inches Stepper */}
                <View style={styles.pillSelectorRow}>
                  <Text style={styles.selectorSublabel}>Inches:</Text>
                  <View style={styles.inlineStepper}>
                    <TouchableOpacity
                      onPress={() => setHeightInches((i) => Math.max(0, i - 1))}
                      style={styles.stepperBtnSmall}>
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.inlineStepperVal}>{heightInches} in</Text>
                    <TouchableOpacity
                      onPress={() => setHeightInches((i) => Math.min(11, i + 1))}
                      style={styles.stepperBtnSmall}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Weight Card (Kg) */}
              <View style={styles.measurementCard}>
                <View style={styles.measurementHeader}>
                  <View style={styles.measurementIconWrap}>
                    <HugeiconsIcon icon={WeightScale01Icon} size={22} color={AppColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.measurementTitle}>Weight</Text>
                    <Text style={styles.measurementSubtitle}>in Kilograms (kg)</Text>
                  </View>
                  <View style={styles.measurementValueTag}>
                    <Text style={styles.measurementValueText}>{weightKg} kg</Text>
                  </View>
                </View>

                <View style={styles.weightControlRow}>
                  <TouchableOpacity
                    onPress={() => setWeightKg((w) => Math.max(30, w - 5))}
                    style={styles.quickWeightBtn}>
                    <Text style={styles.quickWeightBtnText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setWeightKg((w) => Math.max(30, w - 1))}
                    style={styles.quickWeightBtn}>
                    <Text style={styles.quickWeightBtnText}>-1</Text>
                  </TouchableOpacity>

                  <View style={styles.weightBigDisplay}>
                    <Text style={styles.weightBigNumber}>{weightKg}</Text>
                    <Text style={styles.weightBigUnit}>kg</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setWeightKg((w) => Math.min(250, w + 1))}
                    style={styles.quickWeightBtn}>
                    <Text style={styles.quickWeightBtnText}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setWeightKg((w) => Math.min(250, w + 5))}
                    style={styles.quickWeightBtn}>
                    <Text style={styles.quickWeightBtnText}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* BMI Summary Indicator */}
              <View style={styles.bmiCard}>
                <View style={styles.bmiHeader}>
                  <Text style={styles.bmiTitle}>Estimated Body Mass Index</Text>
                  <View style={[styles.bmiBadge, { backgroundColor: AppColors.primarySoft }]}>
                    <Text style={[styles.bmiBadgeText, { color: calculateBMI().color }]}>
                      {calculateBMI().label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bmiScore}>BMI: {calculateBMI().bmi}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButtonWrapper, !isStepValid() && styles.primaryButtonDisabled]}
            onPress={handleNext}
            disabled={!isStepValid() || loading}
            activeOpacity={0.85}>
            <LinearGradient
              colors={isStepValid() ? AppColors.primaryGradient : ['#1E2633', '#161B26']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.primaryButtonText}>
                    {currentStep === 5 ? 'Complete Profile & Save' : 'Continue'}
                  </Text>
                  <HugeiconsIcon icon={ArrowRight02Icon} size={20} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 38,
    height: 38,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepBadgeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  percentageBadge: {
    width: 38,
    alignItems: 'flex-end',
  },
  percentageText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  stepSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  optionsList: {
    gap: 14,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161F',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 16,
  },
  cardOptionSelected: {
    borderColor: AppColors.primary,
    backgroundColor: '#16202B',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1A2130',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconContainerSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  checkIconWrap: {
    marginLeft: 4,
  },
  dateHeroCard: {
    backgroundColor: '#12161F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  dateHeroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateHeroAge: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  dateHeroSubtitle: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerBox: {
    flex: 1,
    backgroundColor: '#12161F',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  datePickerLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1E2633',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stepperInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 32,
  },
  monthDisplay: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 34,
  },
  measurementCard: {
    backgroundColor: '#12161F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    marginBottom: 16,
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  measurementIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  measurementSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  measurementValueTag: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  measurementValueText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  selectorSublabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    minWidth: 50,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillBtnSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  pillBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  pillBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inlineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#161B26',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepperBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E2633',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineStepperVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  weightControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  quickWeightBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickWeightBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  weightBigDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightBigNumber: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  weightBigUnit: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  bmiCard: {
    backgroundColor: '#12161F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bmiTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bmiScore: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
