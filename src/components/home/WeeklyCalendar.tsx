import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { AppColors } from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

// Get today's date (normalized to midnight)
const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Generate an array of weeks around today (past and current only)
const generateWeeks = (weeksBefore = 20, weeksAfter = 0) => {
  const weeks = [];
  const today = getToday();

  // Find Monday of the current week
  const currentDay = today.getDay();
  // If today is Sunday (0), we go back 6 days to Monday. Else go back (currentDay - 1).
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(diff);

  for (let w = -weeksBefore; w <= weeksAfter; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startOfCurrentWeek);
      date.setDate(startOfCurrentWeek.getDate() + (w * 7) + d);
      days.push(date);
    }
    weeks.push({ id: `week-${w}`, days });
  }

  return { weeks, currentWeekIndex: weeksBefore };
};

interface WeeklyCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const { weeks, currentWeekIndex } = React.useMemo(() => generateWeeks(), []);
  const flatListRef = useRef<FlatList>(null);

  // Initial scroll to center the current week
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentWeekIndex,
          animated: false, // snap instantly on mount
        });
      }, 50);
    }
  }, [currentWeekIndex]);

  const handlePress = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const today = getToday();

  const renderDay = (item: Date, index: number) => {
    const isToday = isSameDay(item, today);
    const isSelected = isSameDay(item, selectedDate);
    
    // Formatting day to "Mon", "Tue", etc.
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(item);
    const dateNumber = item.getDate();

    return (
      <TouchableOpacity
        key={item.toISOString()}
        style={styles.dayContainer}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayText, isToday && !isSelected && styles.todayDayText]}>
          {dayName}
        </Text>
        <View
          style={[
            styles.dateCircle,
            isToday && !isSelected && styles.todayDateCircle,
            isSelected && styles.selectedDateCircle,
          ]}
        >
          <Text
            style={[
              styles.dateText,
              isToday && !isSelected && styles.todayDateText,
              isSelected && styles.selectedDateText,
            ]}
          >
            {dateNumber}
          </Text>
        </View>
        {isToday && !isSelected && <View style={styles.todayIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderWeek = ({ item }: { item: { id: string; days: Date[] } }) => {
    return (
      <View style={[styles.weekContainer, { width: screenWidth }]}>
        {item.days.map((date, index) => renderDay(date, index))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={weeks}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        // optimize for paging
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dayContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    height: 80, // fixed height to accommodate the absolute bottom indicator without shifting layout
  },
  dayText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  todayDayText: {
    color: AppColors.primary,
  },
  dateCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    // Border around every date as requested
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  todayDateCircle: {
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  selectedDateCircle: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary, // match border to background
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  todayDateText: {
    color: AppColors.primary,
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.primary,
    position: 'absolute',
    bottom: 0,
  },
});
