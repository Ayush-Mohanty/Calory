import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Activity01Icon } from '@/constants/hugeicons';
import { AppColors } from '@/constants/colors';
import { NutritionLog } from '@/services/firebase';

interface RecentActivityProps {
  logs: NutritionLog[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs }) => {
  // Sort logs by time (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      
      {sortedLogs.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconWrapper}>
            <HugeiconsIcon icon={Activity01Icon} size={32} color={AppColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to log your meals and water for the day.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {sortedLogs.map((log) => {
            const date = new Date(log.createdAt);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const details = [];
            if (log.calories > 0) details.push(`${log.calories} kcal`);
            if (log.protein > 0) details.push(`${log.protein}g Protein`);
            if (log.carbs > 0) details.push(`${log.carbs}g Carbs`);
            if (log.fat > 0) details.push(`${log.fat}g Fat`);
            if (log.water && log.water > 0) details.push(`${log.water}L Water`);

            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTime}>{timeString}</Text>
                </View>
                <Text style={styles.logDetails}>
                  {details.length > 0 ? details.join(' • ') : 'Logged activity'}
                </Text>
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
    marginBottom: 40, // extra padding at the bottom of the scrollview
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
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
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logTime: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  logDetails: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
