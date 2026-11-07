import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  Activity01Icon, 
  Dumbbell01Icon, 
  FireIcon, 
  DropletIcon, 
  Time02Icon,
  SparklesIcon 
} from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { NutritionLog } from '@/services/firebase';

interface RecentActivityProps {
  logs: NutritionLog[];
  selectedDate?: Date;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs, selectedDate }) => {
  // Sort logs by time (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.createdAt - a.createdAt);

  const isToday = !selectedDate || (
    selectedDate.getDate() === new Date().getDate() &&
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear()
  );

  const formattedDateTitle = isToday 
    ? 'Recent Activity' 
    : `Activity (${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{formattedDateTitle}</Text>
        {sortedLogs.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{sortedLogs.length} {sortedLogs.length === 1 ? 'log' : 'logs'}</Text>
          </View>
        )}
      </View>
      
      {sortedLogs.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconWrapper}>
            <HugeiconsIcon icon={Activity01Icon} size={32} color={AppColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No activity logged</Text>
          <Text style={styles.emptySubtitle}>
            {isToday 
              ? 'Tap the + button below to log your workouts and meals for today.' 
              : 'No activities or meals were logged on this date.'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {sortedLogs.map((log) => {
            const date = new Date(log.createdAt);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const isExercise = log.type === 'exercise';

            if (isExercise) {
              // 1. Determine Exercise Type & Styling
              const exerciseType = log.exerciseType || (
                log.name.toLowerCase().includes('cardio') || log.name.toLowerCase().includes('run') || log.name.toLowerCase().includes('walk') || log.name.toLowerCase().includes('cycl')
                  ? 'Cardio'
                  : log.name.toLowerCase().includes('weight') || log.name.toLowerCase().includes('gym') || log.name.toLowerCase().includes('lift')
                  ? 'Weight Lifting'
                  : 'Manual'
              );

              const isCardio = exerciseType === 'Cardio' || log.name.toLowerCase().includes('cardio') || log.name.toLowerCase().includes('run');
              const isWeightLifting = exerciseType === 'Weight Lifting' || log.name.toLowerCase().includes('weight') || log.name.toLowerCase().includes('gym');

              let ExerciseIcon = FireIcon;
              let iconColor: string = AppColors.primary;
              let iconBg: string = 'rgba(41, 143, 80, 0.12)';
              let typeLabel: string = 'Exercise';

              if (isCardio) {
                ExerciseIcon = Activity01Icon;
                iconColor = '#0EA5E9';
                iconBg = 'rgba(14, 165, 233, 0.12)';
                typeLabel = 'Cardio';
              } else if (isWeightLifting) {
                ExerciseIcon = Dumbbell01Icon;
                iconColor = '#8B5CF6';
                iconBg = 'rgba(139, 92, 246, 0.12)';
                typeLabel = 'Weight Lifting';
              } else {
                ExerciseIcon = FireIcon;
                iconColor = '#EF4444';
                iconBg = 'rgba(239, 68, 68, 0.12)';
                typeLabel = log.exerciseType || 'Manual';
              }

              // Clean display name (removes parens if included in name)
              let displayName = log.name;
              if (displayName.includes('(')) {
                displayName = displayName.split('(')[0].trim();
              }
              if (!displayName) {
                displayName = typeLabel;
              }

              // Extract intensity and duration
              const intensity = log.intensity || (
                log.name.includes('High') ? 'High' : log.name.includes('Low') ? 'Low' : log.name.includes('Medium') ? 'Medium' : null
              );
              const duration = log.duration || (
                log.name.match(/(\d+)\s*min/i)?.[1] ? parseInt(log.name.match(/(\d+)\s*min/i)![1], 10) : null
              );

              return (
                <View key={log.id || `exercise-${log.createdAt}`} style={styles.exerciseCard}>
                  {/* Big icon on left based on exercise type */}
                  <View style={[styles.bigIconContainer, { backgroundColor: iconBg }]}>
                    <HugeiconsIcon icon={ExerciseIcon} size={28} color={iconColor} />
                  </View>

                  {/* Right Details Column */}
                  <View style={styles.exerciseDetailsCol}>
                    {/* Top Row: Exercise Name on Left & Log Time on Top Right */}
                    <View style={styles.cardTopRow}>
                      <Text style={styles.exerciseNameText} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={styles.exerciseTimeText}>{timeString}</Text>
                    </View>

                    {/* Middle Row: Fire Icon and Calories Burned */}
                    <View style={styles.calorieBurnRow}>
                      <HugeiconsIcon icon={FireIcon} size={16} color="#EF4444" />
                      <Text style={styles.caloriesBurnText}>
                        {log.calories} Cals Burned
                      </Text>
                    </View>

                    {/* Bottom Row: Intensity with Type and Duration with Value */}
                    <View style={styles.metaRow}>
                      {intensity ? (
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>{intensity} Intensity • {typeLabel}</Text>
                        </View>
                      ) : (
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>{typeLabel}</Text>
                        </View>
                      )}

                      {duration ? (
                        <View style={styles.metaBadge}>
                          <HugeiconsIcon icon={Time02Icon} size={12} color="#64748B" />
                          <Text style={styles.metaBadgeText}>{duration} mins</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }

            // Food / Nutrition / Water Log Card
            const isWater = !!log.water && log.water > 0;
            const foodDetails = [];
            if (log.calories > 0) foodDetails.push(`${log.calories} kcal`);
            if (log.protein > 0) foodDetails.push(`${log.protein}g Protein`);
            if (log.carbs > 0) foodDetails.push(`${log.carbs}g Carbs`);
            if (log.fat > 0) foodDetails.push(`${log.fat}g Fat`);
            if (isWater) foodDetails.push(`${log.water}L Water`);

            return (
              <View key={log.id || `food-${log.createdAt}`} style={styles.foodCard}>
                <View style={[styles.foodIconContainer, { backgroundColor: isWater ? 'rgba(14, 165, 233, 0.12)' : 'rgba(41, 143, 80, 0.12)' }]}>
                  <HugeiconsIcon 
                    icon={isWater ? DropletIcon : SparklesIcon} 
                    size={24} 
                    color={isWater ? '#0EA5E9' : AppColors.primary} 
                  />
                </View>

                <View style={styles.foodDetailsCol}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.foodTitleText} numberOfLines={1}>
                      {log.name || (isWater ? 'Water Intake' : 'Meal')}
                    </Text>
                    <Text style={styles.foodTimeText}>{timeString}</Text>
                  </View>

                  <Text style={styles.foodSubText}>
                    {foodDetails.length > 0 ? foodDetails.join(' • ') : 'Logged meal'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    gap: 12,
  },
  // Exercise Card Styles
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bigIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  exerciseDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  exerciseTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  calorieBurnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  caloriesBurnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  // Food Card Styles
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  foodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foodDetailsCol: {
    flex: 1,
  },
  foodTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  foodTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  foodSubText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
