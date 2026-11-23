import { AppColors } from '@/constants/colors';
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Image01Icon,
  SparklesIcon,
  Tick02Icon,
} from '@/constants/hugeicons';
import {
  AnalyzedFoodResult,
  analyzeFoodImageWithGemini,
  convertImageUriToBase64,
  getCachedFoodImageBase64,
  getFallbackFoodAnalysis,
} from '@/services/gemini';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // AI analyzed food result state
  const [detectedMeal, setDetectedMeal] = useState<AnalyzedFoodResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function runFoodVisionAnalysis() {
      try {
        setAnalysisError(null);
        setStep1Status('loading');
        setStep2Status('pending');
        setStep3Status('pending');
        setIsCompleted(false);

        // 1. Retrieve image base64 (either cached in memory or read from file URI)
        let base64 = getCachedFoodImageBase64();
        if (!base64 && imageUri) {
          try {
            base64 = await convertImageUriToBase64(imageUri);
          } catch (readErr) {
            console.warn('[AnalyzingFood] Failed to convert image to base64:', readErr);
          }
        }

        // Allow at least 600ms for Step 1 visual feedback ("Analyzing food")
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (!isMounted) return;

        // Transition: Step 1 completed -> Step 2 loading ("Getting Nutrition data")
        setStep1Status('completed');
        setStep2Status('loading');

        // 2. Call Gemini AI Vision model
        const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const aiResult = await analyzeFoodImageWithGemini(base64 || '', mimeType);
        if (!isMounted) return;

        // Transition: Step 2 completed -> Step 3 loading ("Get final result")
        setStep2Status('completed');
        setStep3Status('loading');

        // Allow 400ms for Step 3 compilation
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (!isMounted) return;

        // Transition: Step 3 completed -> Final result ready
        setStep3Status('completed');
        setDetectedMeal(aiResult);
        setIsCompleted(true);
      } catch (error: any) {
        console.error('[AnalyzingFood] Analysis error:', error);
        if (!isMounted) return;
        setAnalysisError(error?.message || 'Unable to recognize food. Tap retry to analyze again.');
        setStep1Status('completed');
        setStep2Status('completed');
        setStep3Status('completed');
        const fallback = getFallbackFoodAnalysis('Food Item');
        setDetectedMeal(fallback);
        setIsCompleted(true);
      }
    }

    if (imageUri || getCachedFoodImageBase64()) {
      runFoodVisionAnalysis();
    } else {
      const fallback = getFallbackFoodAnalysis('Food Item');
      setDetectedMeal(fallback);
      setStep1Status('completed');
      setStep2Status('completed');
      setStep3Status('completed');
      setIsCompleted(true);
    }

    return () => {
      isMounted = false;
    };
  }, [imageUri, retryTrigger]);

  const handleRetry = () => {
    setAnalysisError(null);
    setDetectedMeal(null);
    setIsCompleted(false);
    setRetryTrigger((prev) => prev + 1);
  };

  const handleContinue = () => {
    if (!detectedMeal) return;
    // Navigate to food-details with the analyzed meal data pre-filled
    router.replace({
      pathname: '/food-details',
      params: {
        name: detectedMeal.name,
        calories: String(detectedMeal.calories),
        protein: String(detectedMeal.protein),
        carbs: String(detectedMeal.carbs),
        fat: String(detectedMeal.fat),
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
      {/* Header with Back Button and Heading 'Analyzing Food' below */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Analyzing Food</Text>
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
                <HugeiconsIcon icon={Image01Icon} size={48} color="#94A3B8" />
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
        {isCompleted && detectedMeal && (
          <View style={styles.resultSummaryCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <HugeiconsIcon icon={SparklesIcon} size={12} color="#166534" />
                <Text style={styles.resultLabel}>AI Identified Meal</Text>
              </View>
              <Text style={styles.resultCalories}>{detectedMeal.calories} kcal</Text>
            </View>
            <Text style={styles.resultMealName}>{detectedMeal.name}</Text>
            <Text style={styles.resultServing}>Portion: {detectedMeal.servingSize}</Text>
            <View style={styles.resultMacroRow}>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillLabel}>Protein</Text>
                <Text style={styles.macroPillValue}>{detectedMeal.protein}g</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillLabel}>Carbs</Text>
                <Text style={styles.macroPillValue}>{detectedMeal.carbs}g</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillLabel}>Fat</Text>
                <Text style={styles.macroPillValue}>{detectedMeal.fat}g</Text>
              </View>
            </View>
          </View>
        )}

        {/* Error or Notice Alert if analysis encountered an issue */}
        {analysisError && (
          <View style={styles.errorNoticeCard}>
            <Text style={styles.errorNoticeTitle}>AI Recognition Notice</Text>
            <Text style={styles.errorNoticeText}>{analysisError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry AI Scan</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
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
    color: '#94A3B8',
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    backgroundColor: '#298f50',
    opacity: 0.8,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressCardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusPillCompleted: {
    backgroundColor: 'rgba(41, 143, 80, 0.12)',
  },
  statusPillText: {
    color: '#D97706',
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusPillTextCompleted: {
    color: '#166534',
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
  },
  checkboxLoading: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(41, 143, 80, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.3)',
  },
  checkboxPending: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  connectingLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E2E8F0',
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
    color: '#64748B',
    fontSize: 14.5,
    fontWeight: '600',
  },
  stepTitleCompleted: {
    color: '#0F172A',
    fontWeight: '700',
  },
  stepTitleLoading: {
    color: '#166534',
    fontWeight: '700',
  },
  stepSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 17,
  },
  resultSummaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(41, 143, 80, 0.35)',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  resultLabel: {
    color: '#166534',
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultCalories: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '800',
  },
  resultMealName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  resultServing: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '500',
    marginBottom: 12,
  },
  resultMacroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  macroPillValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  continueButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
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
  errorNoticeCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 8,
    marginBottom: 8,
  },
  errorNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  errorNoticeText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
