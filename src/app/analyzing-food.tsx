import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Tick02Icon,
  SparklesIcon,
  Image01Icon,
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';

const { width } = Dimensions.get('window');

type StepStatus = 'pending' | 'loading' | 'completed';

interface AnalysisStep {
  id: number;
  title: string;
  subtitle: string;
}

const STEPS: AnalysisStep[] = [
  {
    id: 1,
    title: 'Analyzing food',
    subtitle: 'Detecting meal items, ingredients & portion sizes',
  },
  {
    id: 2,
    title: 'Getting Nutrition data',
    subtitle: 'Calculating calories, protein, carbs & fats breakdown',
  },
  {
    id: 3,
    title: 'Get final result',
    subtitle: 'Nutritional profile & macros successfully compiled',
  },
];

export default function AnalyzingFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Decode the image URI received from the scanner dialog
  const rawUri = (params.imageUri as string) || '';
  const imageUri = rawUri ? decodeURIComponent(rawUri) : '';

  // Track the status of each step: 'pending' | 'loading' | 'completed'
  const [step1Status, setStep1Status] = useState<StepStatus>('loading');
  const [step2Status, setStep2Status] = useState<StepStatus>('pending');
  const [step3Status, setStep3Status] = useState<StepStatus>('pending');
  const [isCompleted, setIsCompleted] = useState(false);

  // Simulated AI nutrition result
  const detectedMeal = {
    name: 'Grilled Salmon & Quinoa Bowl',
    calories: '520',
    protein: '44',
    carbs: '48',
    fat: '16',
    servingSize: '1 bowl (380g)',
  };

  useEffect(() => {
    // Step 1: Analyzing food (0ms -> 1500ms)
    const timer1 = setTimeout(() => {
      setStep1Status('completed');
      setStep2Status('loading');
    }, 1500);

    // Step 2: Getting Nutrition data (1500ms -> 3200ms)
    const timer2 = setTimeout(() => {
      setStep2Status('completed');
      setStep3Status('loading');
    }, 3200);

    // Step 3: Get final result (3200ms -> 4600ms)
    const timer3 = setTimeout(() => {
      setStep3Status('completed');
      setIsCompleted(true);
    }, 4600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleContinue = () => {
    // Navigate to food-details with the analyzed meal data pre-filled
    router.replace({
      pathname: '/food-details',
      params: {
        name: detectedMeal.name,
        calories: detectedMeal.calories,
        protein: detectedMeal.protein,
        carbs: detectedMeal.carbs,
        fat: detectedMeal.fat,
        servingSize: detectedMeal.servingSize,
      },
    });
  };

  const getStepStatus = (stepId: number): StepStatus => {
    if (stepId === 1) return step1Status;
    if (stepId === 2) return step2Status;
    return step3Status;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header with Back Button and Heading 'Analyzing Food' */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Analyzing Food</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Square Picture Display */}
        <View style={styles.imageCardWrapper}>
          <View style={styles.squareImageContainer}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.squareImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <HugeiconsIcon icon={Image01Icon} size={48} color="#64748B" />
                <Text style={styles.imagePlaceholderText}>No Image Selected</Text>
              </View>
            )}

            {/* Ambient Scanning Badge */}
            <View style={styles.scanBadge}>
              <HugeiconsIcon icon={SparklesIcon} size={13} color="#FFFFFF" />
              <Text style={styles.scanBadgeText}>
                {isCompleted ? 'ANALYZED' : 'SCANNING'}
              </Text>
            </View>

            {/* Scanning Laser Line when in progress */}
            {!isCompleted && <View style={styles.scanLine} />}
          </View>
        </View>

        {/* 3-Step Progress Indicator Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardTitle}>AI Processing</Text>
            <View style={[styles.statusPill, isCompleted && styles.statusPillCompleted]}>
              <Text style={[styles.statusPillText, isCompleted && styles.statusPillTextCompleted]}>
                {isCompleted ? 'Complete' : 'In Progress'}
              </Text>
            </View>
          </View>

          <View style={styles.stepsList}>
            {STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const isLast = index === STEPS.length - 1;

              return (
                <View key={step.id} style={styles.stepItemWrapper}>
                  <View style={styles.stepRow}>
                    {/* Checkbox / Loading Indicator */}
                    <View style={styles.checkboxColumn}>
                      <View style={styles.checkboxContainer}>
                        {status === 'completed' ? (
                          <View style={styles.checkboxChecked}>
                            <HugeiconsIcon icon={Tick02Icon} size={13} color="#FFFFFF" />
                          </View>
                        ) : status === 'loading' ? (
                          <View style={styles.checkboxLoading}>
                            <ActivityIndicator size="small" color={AppColors.primary} />
                          </View>
                        ) : (
                          <View style={styles.checkboxPending} />
                        )}
                      </View>

                      {/* Connecting vertical line between steps */}
                      {!isLast && (
                        <View
                          style={[
                            styles.connectingLine,
                            status === 'completed' && styles.connectingLineActive,
                          ]}
                        />
                      )}
                    </View>

                    {/* Step Title & Subtitle */}
                    <View style={styles.stepContent}>
                      <View style={styles.stepTitleRow}>
                        <Text
                          style={[
                            styles.stepTitle,
                            status === 'completed' && styles.stepTitleCompleted,
                            status === 'loading' && styles.stepTitleLoading,
                          ]}
                        >
                          {step.title}
                        </Text>
                      </View>
                      <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Meal Preview Snippet when Completed */}
        {isCompleted && (
          <View style={styles.resultSummaryCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>Identified Meal</Text>
              <Text style={styles.resultCalories}>{detectedMeal.calories} kcal</Text>
            </View>
            <Text style={styles.resultMealName}>{detectedMeal.name}</Text>
            <View style={styles.resultMacroRow}>
              <Text style={styles.macroPill}>Protein: {detectedMeal.protein}g</Text>
              <Text style={styles.macroPill}>Carbs: {detectedMeal.carbs}g</Text>
              <Text style={styles.macroPill}>Fat: {detectedMeal.fat}g</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Continue Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.continueButtonWrapper, !isCompleted && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isCompleted}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={
              isCompleted
                ? AppColors.primaryGradient
                : ['rgba(41, 143, 80, 0.35)', 'rgba(41, 143, 80, 0.25)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            {!isCompleted ? (
              <View style={styles.buttonInner}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.continueButtonText}>Analyzing food...</Text>
              </View>
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.continueButtonText}>Continue</Text>
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#FFFFFF" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const squareSize = Math.min(width - 56, 280);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0D1117',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  imageCardWrapper: {
    marginBottom: 20,
    alignItems: 'center',
  },
  squareImageContainer: {
    width: squareSize,
    height: squareSize,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#12161F',
    borderWidth: 1.5,
    borderColor: 'rgba(41, 143, 80, 0.4)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  scanBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(9, 12, 16, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scanBadgeText: {
    color: '#6ee7b7',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4ec57c',
    opacity: 0.8,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#12161F',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusPillCompleted: {
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
  },
  statusPillText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusPillTextCompleted: {
    color: '#6ee7b7',
  },
  stepsList: {
    gap: 4,
  },
  stepItemWrapper: {
    position: 'relative',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  checkboxContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4ec57c',
  },
  checkboxLoading: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.4)',
  },
  checkboxPending: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  connectingLine: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 2,
  },
  connectingLineActive: {
    backgroundColor: AppColors.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stepTitle: {
    color: '#94A3B8',
    fontSize: 14.5,
    fontWeight: '600',
  },
  stepTitleCompleted: {
    color: '#FFFFFF',
  },
  stepTitleLoading: {
    color: '#6ee7b7',
  },
  stepSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 17,
  },
  resultSummaryCard: {
    width: '100%',
    backgroundColor: '#161B26',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.3)',
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultCalories: {
    color: '#4ec57c',
    fontSize: 15,
    fontWeight: '700',
  },
  resultMealName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  resultMacroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    color: '#94A3B8',
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0D1117',
  },
  continueButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.75,
  },
  continueButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

