import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';

import { AppColors } from '@/constants/colors';
import { OnboardingData } from '@/services/storage';
import {
  generateNutritionPlan,
  AiNutritionPlan,
  MealBreakdownItem,
} from '@/services/gemini';
import { saveAiPlanToFirestore } from '@/services/firebase';
import { saveAiPlanToLocalStorage } from '@/services/storage';
import {
  SparklesIcon,
  FireIcon,
  EnergyIcon,
  Dumbbell01Icon,
  DropletIcon,
  CheckmarkCircle02Icon,
  Tick02Icon,
  RefreshIcon,
  ArrowRight02Icon,
  Calendar03Icon,
  Activity01Icon,
} from '@/constants/hugeicons';

interface AiNutritionPlanScreenProps {
  onboardingData: OnboardingData;
  userId: string;
  initialPlan?: AiNutritionPlan | null;
  onProceed?: () => void;
  onPlanGenerated?: (plan: AiNutritionPlan) => void;
}

const LOADING_STAGES = [
  {
    title: 'Biometric Analysis',
    desc: 'Calculating basal metabolic rate (BMR) from age, height, and weight...',
    progress: 25,
  },
  {
    title: 'Gemini AI Computation',
    desc: 'Aligning caloric balance with your primary fitness goal and activity...',
    progress: 55,
  },
  {
    title: 'Macronutrient Synthesis',
    desc: 'Optimizing high-yield protein, complex carbs, and essential fats...',
    progress: 80,
  },
  {
    title: 'Hydration & Meal Blueprint',
    desc: 'Calibrating optimal daily water intake and meal breakdown...',
    progress: 95,
  },
  {
    title: 'Securing Cloud Profile',
    desc: 'Saving your personalized blueprint to Firebase Firestore...',
    progress: 100,
  },
];

const NUTRITION_TIPS = [
  'Tip: Consuming adequate protein during a caloric deficit preserves lean muscle tissue.',
  'Tip: Drinking a glass of water immediately upon waking fires up your metabolism.',
  'Tip: Complex carbohydrates provide sustained glycogen for high-energy training sessions.',
  'Tip: Healthy fats are vital for hormone production and joint longevity.',
];

export const AiNutritionPlanScreen: React.FC<AiNutritionPlanScreenProps> = ({
  onboardingData,
  userId,
  initialPlan,
  onProceed,
  onPlanGenerated,
}) => {
  const [plan, setPlan] = useState<AiNutritionPlan | null>(initialPlan || null);
  const [loading, setLoading] = useState<boolean>(!initialPlan);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [tipIdx, setTipIdx] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animations
  const animatedProgress = useRef(new Animated.Value(initialPlan ? 100 : 10)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for AI glowing badge
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  // Tip rotator
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTipIdx((prev) => (prev + 1) % NUTRITION_TIPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  // Execute AI generation
  const executeGeneration = async () => {
    setLoading(true);
    setErrorMsg(null);
    setCurrentStageIdx(0);

    // Animate stage 1
    Animated.timing(animatedProgress, {
      toValue: 25,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Stage 2
    const stage2Timer = setTimeout(() => {
      setCurrentStageIdx(1);
      Animated.timing(animatedProgress, {
        toValue: 55,
        duration: 900,
        useNativeDriver: false,
      }).start();
    }, 900);

    // Stage 3
    const stage3Timer = setTimeout(() => {
      setCurrentStageIdx(2);
      Animated.timing(animatedProgress, {
        toValue: 80,
        duration: 900,
        useNativeDriver: false,
      }).start();
    }, 1900);

    try {
      // Call Gemini AI service
      const generated = await generateNutritionPlan(onboardingData);

      // Stage 4: Finalizing
      setCurrentStageIdx(3);
      Animated.timing(animatedProgress, {
        toValue: 95,
        duration: 600,
        useNativeDriver: false,
      }).start();

      // Stage 5: Save to local storage & Firestore
      await saveAiPlanToLocalStorage(generated);
      if (userId) {
        await saveAiPlanToFirestore(userId, generated);
      }

      setCurrentStageIdx(4);
      Animated.timing(animatedProgress, {
        toValue: 100,
        duration: 400,
        useNativeDriver: false,
      }).start();

      // Brief delay to allow completion state to be felt
      setTimeout(() => {
        setPlan(generated);
        setLoading(false);
        if (onPlanGenerated) {
          onPlanGenerated(generated);
        }
      }, 500);
    } catch (err: any) {
      console.error('[AiNutritionPlanScreen] Generation error:', err);
      setErrorMsg('Failed to generate AI plan. Please check connection and try again.');
      setLoading(false);
    } finally {
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
    }
  };

  useEffect(() => {
    if (!initialPlan) {
      executeGeneration();
    }
  }, []);

  // -------------------------------------------------------------
  // RENDER: Loading Progress View
  // -------------------------------------------------------------
  if (loading) {
    const progressWidthInterpolated = animatedProgress.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.loadingContainer}>

          {/* Glowing AI Icon */}
          <View style={styles.aiOrbWrapper}>
            <Animated.View
              style={[
                styles.aiPulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <LinearGradient
              colors={AppColors.primaryGradient}
              style={styles.aiOrbCenter}>
              <HugeiconsIcon icon={SparklesIcon} size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Headline */}
          <Text style={styles.loadingTitle}>Generating Your AI Plan</Text>
          <Text style={styles.loadingSubtitle}>
            Gemini AI is analyzing your biometric profile to formulate your personalized nutrition targets.
          </Text>

          {/* Progress Bar with Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidthInterpolated },
                ]}
              />
            </View>
            <View style={styles.progressMetaRow}>
              <Text style={styles.progressCurrentPhase}>
                {LOADING_STAGES[currentStageIdx]?.title || 'Processing'}
              </Text>
              <Text style={styles.progressPercentText}>
                {LOADING_STAGES[currentStageIdx]?.progress || 25}%
              </Text>
            </View>
          </View>

          {/* Step Timeline */}
          <View style={styles.stagesList}>
            {LOADING_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <View key={stage.title} style={styles.stageItem}>
                  <View
                    style={[
                      styles.stageDot,
                      isDone && styles.stageDotDone,
                      isCurrent && styles.stageDotCurrent,
                    ]}>
                    {isDone ? (
                      <HugeiconsIcon icon={Tick02Icon} size={12} color="#FFFFFF" />
                    ) : isCurrent ? (
                      <ActivityIndicator size="small" color={AppColors.primary} />
                    ) : (
                      <View style={styles.stageDotPending} />
                    )}
                  </View>
                  <View style={styles.stageTextWrap}>
                    <Text
                      style={[
                        styles.stageTitle,
                        isDone && styles.stageTitleDone,
                        isCurrent && styles.stageTitleCurrent,
                      ]}>
                      {stage.title}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stageDesc}>{stage.desc}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Dynamic Fitness Tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <HugeiconsIcon icon={SparklesIcon} size={16} color={AppColors.primary} />
            </View>
            <Text style={styles.tipText}>{NUTRITION_TIPS[tipIdx]}</Text>
          </View>

        </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Error View (with Retry)
  // -------------------------------------------------------------
  if (errorMsg || !plan) {
    return (
      <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Plan Formulation Notice</Text>
          <Text style={styles.errorDesc}>{errorMsg || 'Unable to load plan.'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={executeGeneration}
            activeOpacity={0.8}>
            <HugeiconsIcon icon={RefreshIcon} size={18} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Complete Generated AI Nutrition & Fitness Plan (HIDDEN for now)
  // -------------------------------------------------------------
  return null;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiOrbWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  aiPulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(41, 143, 80, 0.25)',
  },
  aiOrbCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 320,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 28,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressCurrentPhase: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stagesList: {
    width: '100%',
    backgroundColor: '#12161F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stageDotDone: {
    backgroundColor: AppColors.primary,
  },
  stageDotCurrent: {
    backgroundColor: 'rgba(41, 143, 80, 0.2)',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  stageDotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stageTextWrap: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  stageTitleDone: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  stageTitleCurrent: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stageDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 143, 80, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.2)',
    width: '100%',
  },
  tipIconWrap: {
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.3)',
  },
  aiTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  refreshIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#12161F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cloudSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.25)',
  },
  cloudSyncText: {
    fontSize: 12,
    color: '#6EE7B7',
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.35)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroGlowOverlay: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(41, 143, 80, 0.2)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroCaloriesNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroCaloriesUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  heroGoalBadge: {
    backgroundColor: 'rgba(41, 143, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.4)',
  },
  heroGoalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  heroGoalDesc: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 10,
  },
  heroSummaryText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94A3B8',
    lineHeight: 18,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#12161F',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroGramText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  macroPctTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  macroPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroCalText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  hydrationCard: {
    backgroundColor: '#12161F',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  hydrationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationHeaderTextWrap: {
    flex: 1,
  },
  hydrationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hydrationSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  hydrationStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  hydrationStatBox: {
    alignItems: 'center',
  },
  hydrationStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#06B6D4',
  },
  hydrationStatUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  hydrationDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
  },
  glassIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  glassMiniIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreGlassesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
    marginLeft: 4,
  },
  metabolicGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  metabolicItem: {
    flex: 1,
    backgroundColor: '#12161F',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metabolicItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metabolicItemVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metabolicItemSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  mealList: {
    gap: 10,
    marginTop: 10,
  },
  mealCard: {
    backgroundColor: '#12161F',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mealCalBadge: {
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mealCalText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  mealSuggestion: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 8,
  },
  mealMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealMacroP: {
    fontSize: 11,
    fontWeight: '600',
    color: '#60A5FA',
  },
  mealMacroC: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  mealMacroF: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F472B6',
  },
  mealMacroBullet: {
    fontSize: 10,
    color: '#475569',
  },
  adviceList: {
    backgroundColor: '#12161F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
    marginTop: 10,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  adviceCheckWrap: {
    marginTop: 2,
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  proceedButtonWrapper: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
