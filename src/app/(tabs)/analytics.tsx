import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  WeightScale01Icon,
  Tick02Icon,
  Edit02Icon,
  Cancel01Icon,
  DropletIcon,
  Dumbbell01Icon,
  FireIcon,
  SparklesIcon,
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { useUser } from '@/services/auth';
import {
  subscribeToAllUserNutritionLogs,
  NutritionLog,
} from '@/services/firebase';
import {
  getUserWeight,
  saveUserWeight,
  getOnboardingFromLocalStorage,
  getAiPlanFromLocalStorage,
  OnboardingData,
} from '@/services/storage';

const { width } = Dimensions.get('window');

interface WeekDayItem {
  dayName: string;
  dateString: string;
  isToday: boolean;
  hasActivity: boolean;
}

export default function AnalyticsTab() {
  const { user } = useUser();

  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [userWeight, setUserWeight] = useState<number>(68.0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [aiPlan, setAiPlan] = useState<any>(null);

  // Weight edit modal state
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  // Format date to local YYYY-MM-DD
  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Real-time listener for all user activities across all dates
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;

      const unsubscribe = subscribeToAllUserNutritionLogs(user.id, (fetchedLogs) => {
        setLogs(fetchedLogs);
      });

      // Also reload weight & onboarding profile
      async function reloadProfile() {
        const [w, ob, plan] = await Promise.all([
          getUserWeight(),
          getOnboardingFromLocalStorage(),
          getAiPlanFromLocalStorage(),
        ]);
        if (w && w > 0) setUserWeight(w);
        if (ob) setOnboardingData(ob);
        if (plan) setAiPlan(plan);
      }
      reloadProfile();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [user?.id])
  );

  // Compute set of all dates where the user logged at least one activity
  const activeDatesSet = new Set<string>();
  logs.forEach((log) => {
    if (log.date) {
      activeDatesSet.add(log.date);
    }
  });

  // Calculate current week days: S, M, T, W, T, F, S (Sunday -> Saturday)
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - currentDayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDays: WeekDayItem[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateStr = formatDateStr(d);
    weekDays.push({
      dayName: dayLetters[i],
      dateString: dateStr,
      isToday: dateStr === formatDateStr(now),
      hasActivity: activeDatesSet.has(dateStr),
    });
  }

  // Calculate consecutive daily streak count
  let streakCount = 0;
  const todayStr = formatDateStr(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateStr(yesterday);

  let checkDate: Date | null = new Date(now);

  if (!activeDatesSet.has(todayStr)) {
    if (activeDatesSet.has(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      checkDate = null;
    }
  }

  if (checkDate) {
    const runner = new Date(checkDate);
    while (true) {
      const ds = formatDateStr(runner);
      if (activeDatesSet.has(ds)) {
        streakCount++;
        runner.setDate(runner.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Active days this week count
  const activeDaysThisWeek = weekDays.filter((d) => d.hasActivity).length;

  // Compute week metrics from logs
  const currentWeekDateStrings = new Set(weekDays.map((d) => d.dateString));
  const currentWeekLogs = logs.filter((l) => currentWeekDateStrings.has(l.date));

  const totalFoodLogs = currentWeekLogs.filter((l) => l.type === 'food' || !l.type).length;
  const totalWorkouts = currentWeekLogs.filter((l) => l.type === 'exercise').length;
  const totalWaterLitres = currentWeekLogs.reduce((sum, l) => sum + (l.water || 0), 0);

  // Goal & Target helper texts
  const goalText =
    onboardingData?.goal === 'lose_weight'
      ? 'Fat Loss Protocol'
      : onboardingData?.goal === 'gain_weight'
      ? 'Hypertrophy Goal'
      : 'Physique Maintenance';

  const handleOpenWeightModal = () => {
    setWeightInput(userWeight.toString());
    setIsWeightModalVisible(true);
  };

  const handleSaveWeight = async () => {
    const val = parseFloat(weightInput.trim());
    if (isNaN(val) || val <= 20 || val >= 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (e.g. 68.5).');
      return;
    }
    const rounded = Math.round(val * 10) / 10;
    setUserWeight(rounded);
    await saveUserWeight(rounded);
    setIsWeightModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header with big heading 'Progress' */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>
          Track your daily consistency, streak & body metrics
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Two Cards in a Row: 1. Daily Streak, 2. My Weight */}
        <View style={styles.cardsRow}>
          {/* Card 1: Daily Streak */}
          <View style={styles.metricCard}>
            <View style={styles.cardTopRow}>
              {/* Fire Icon from assets/images folder */}
              <View style={styles.fireIconWrapper}>
                <Image
                  source={require('../../../assets/images/fire.png')}
                  style={styles.fireIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>{streakCount}d</Text>
              </View>
            </View>

            {/* Text as 'Day Streak' */}
            <Text style={styles.cardHeading}>Day Streak</Text>

            {/* Current week streak data with checkbox and days: S, M, T, W, T, F, S */}
            <View style={styles.weekDaysContainer}>
              {weekDays.map((day, idx) => (
                <View key={`${day.dateString}-${idx}`} style={styles.dayColumn}>
                  <Text
                    style={[
                      styles.dayLetter,
                      day.isToday && styles.dayLetterToday,
                    ]}
                  >
                    {day.dayName}
                  </Text>

                  {/* Checkbox: checked when user added at least one activity for that day */}
                  <View
                    style={[
                      styles.checkbox,
                      day.hasActivity
                        ? styles.checkboxChecked
                        : styles.checkboxUnchecked,
                      day.isToday && !day.hasActivity && styles.checkboxTodayPending,
                    ]}
                  >
                    {day.hasActivity ? (
                      <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFFFFF" />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Card 2: My Weight */}
          <View style={styles.metricCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.scaleIconWrapper}>
                <HugeiconsIcon
                  icon={WeightScale01Icon}
                  size={20}
                  color={AppColors.primary}
                />
              </View>
              <TouchableOpacity
                onPress={handleOpenWeightModal}
                style={styles.editPill}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <HugeiconsIcon icon={Edit02Icon} size={11} color="#475569" />
                <Text style={styles.editPillText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardHeading}>My Weight</Text>

            <View style={styles.weightValueRow}>
              <Text style={styles.weightValue}>{userWeight.toFixed(1)}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>

            <View style={styles.weightFooterBadge}>
              <Text style={styles.weightFooterText} numberOfLines={1}>
                {goalText}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Consistency Card */}
        <View style={styles.consistencyCard}>
          <View style={styles.consistencyHeader}>
            <View>
              <Text style={styles.consistencyTitle}>Weekly Consistency</Text>
              <Text style={styles.consistencySubtitle}>
                {activeDaysThisWeek} of 7 days completed this week
              </Text>
            </View>
            <View style={styles.consistencyPercentPill}>
              <HugeiconsIcon icon={SparklesIcon} size={12} color="#166534" />
              <Text style={styles.consistencyPercentText}>
                {Math.round((activeDaysThisWeek / 7) * 100)}%
              </Text>
            </View>
          </View>

          {/* Consistency Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(6, (activeDaysThisWeek / 7) * 100)}%` },
              ]}
            />
          </View>

          <Text style={styles.motivationalText}>
            {streakCount >= 5
              ? "🔥 Outstanding momentum! You're crushing your daily habits."
              : streakCount >= 2
              ? '💪 Great progress! Keep adding your daily meals & workouts.'
              : '🌟 Add an activity today to build your streak!'}
          </Text>
        </View>

        {/* Weekly Activities Summary */}
        <Text style={styles.sectionHeading}>Weekly Activity Breakdown</Text>
        <View style={styles.statsRow}>
          {/* Meals Logged */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
              ]}
            >
              <HugeiconsIcon icon={FireIcon} size={18} color="#EF4444" />
            </View>
            <Text style={styles.statCount}>{totalFoodLogs}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>

          {/* Workouts */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: 'rgba(139, 92, 246, 0.1)' },
              ]}
            >
              <HugeiconsIcon icon={Dumbbell01Icon} size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.statCount}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          {/* Water Logged */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: 'rgba(14, 165, 233, 0.1)' },
              ]}
            >
              <HugeiconsIcon icon={DropletIcon} size={18} color="#0EA5E9" />
            </View>
            <Text style={styles.statCount}>
              {totalWaterLitres > 0 ? `${totalWaterLitres.toFixed(1)}L` : '0L'}
            </Text>
            <Text style={styles.statLabel}>Hydration</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Weight Dialog Modal */}
      <Modal
        visible={isWeightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsWeightModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Weight</Text>
              <TouchableOpacity
                onPress={() => setIsWeightModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter your current body weight in kilograms.
            </Text>

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 68.5"
                placeholderTextColor="#94A3B8"
                autoFocus
              />
              <Text style={styles.modalInputUnit}>kg</Text>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsWeightModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveWeight}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 154,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fireIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  fireIcon: {
    width: 22,
    height: 22,
  },
  streakBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  scaleIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.2)',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  editPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 6,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 5,
  },
  dayLetter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  dayLetterToday: {
    color: AppColors.primary,
    fontWeight: '800',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AppColors.primary,
  },
  checkboxUnchecked: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  checkboxTodayPending: {
    borderColor: AppColors.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  weightValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  weightUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  weightFooterBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  weightFooterText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  consistencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  consistencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  consistencySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  consistencyPercentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  consistencyPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  motivationalText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 12,
  },
  modalInputUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
