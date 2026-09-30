import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/expo';
import { HugeiconsIcon } from '@hugeicons/react-native';

import { AiNutritionPlanScreen } from '@/components/plan/AiNutritionPlanScreen';
import { HomeHeader } from '@/components/home/HomeHeader';
import { WeeklyCalendar } from '@/components/home/WeeklyCalendar';
import { CaloriesCard } from '@/components/home/CaloriesCard';
import { WaterCard } from '@/components/home/WaterCard';
import {
  getOnboardingFromLocalStorage,
  getAiPlanFromLocalStorage,
  saveAiPlanToLocalStorage,
  OnboardingData,
} from '@/services/storage';
import { subscribeToNutritionLogs, NutritionLog, saveAiPlanToFirestore } from '@/services/firebase';
import { AiNutritionPlan } from '@/services/gemini';
import { AppColors } from '@/constants/colors';

export default function HomeTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [aiPlan, setAiPlan] = useState<AiNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<NutritionLog[]>([]);

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dateString = formatDateLocal(selectedDate);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToNutritionLogs(user.id, dateString, (fetchedLogs) => {
      setLogs(fetchedLogs);
    });
    return () => unsubscribe();
  }, [user?.id, dateString]);

  useEffect(() => {
    async function fetchLocalData() {
      if (!isSignedIn || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const [localData, localPlan] = await Promise.all([
          getOnboardingFromLocalStorage(),
          getAiPlanFromLocalStorage(),
        ]);
        if (localData) setOnboardingData(localData);
        if (localPlan) setAiPlan(localPlan);
      } catch (err) {
        console.error('Error fetching data in HomeTab:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchLocalData();
    }
  }, [isLoaded, isSignedIn, user]);

  if (isLoading || !isLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (!onboardingData) {
    // Should theoretically not happen since index.tsx enforces onboarding before tabs
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#fff' }}>No plan found. Please complete onboarding.</Text>
      </View>
    );
  }

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Athlete';
  const avatarUrl = user?.imageUrl || null;

  const consumedCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const consumedProtein = logs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const consumedCarbs = logs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const consumedFat = logs.reduce((sum, log) => sum + (log.fat || 0), 0);
  const consumedWater = logs.reduce((sum, log) => sum + (log.water || 0), 0);

  const handlePlanUpdate = async (updatedValues: { dailyCalories: number, proteinsGrams: number, carbsGrams: number, fatsGrams: number }) => {
    if (!aiPlan) return;
    const updatedPlan = { ...aiPlan, ...updatedValues };
    setAiPlan(updatedPlan);
    await saveAiPlanToLocalStorage(updatedPlan);
    if (user?.id) {
      await saveAiPlanToFirestore(user.id, updatedPlan);
    }
  };

  const handleWaterPlanUpdate = async (updatedWaterLiters: number) => {
    if (!aiPlan) return;
    const updatedPlan = { ...aiPlan, waterLiters: updatedWaterLiters };
    setAiPlan(updatedPlan);
    await saveAiPlanToLocalStorage(updatedPlan);
    if (user?.id) {
      await saveAiPlanToFirestore(user.id, updatedPlan);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {aiPlan ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <HomeHeader displayName={displayName} avatarUrl={avatarUrl} />
          <WeeklyCalendar onDateSelect={(date) => setSelectedDate(date)} />
          <CaloriesCard 
            totalCalories={aiPlan.dailyCalories} 
            consumedCalories={consumedCalories} 
            protein={aiPlan.proteinsGrams}
            consumedProtein={consumedProtein}
            carbs={aiPlan.carbsGrams}
            consumedCarbs={consumedCarbs}
            fat={aiPlan.fatsGrams}
            consumedFat={consumedFat}
            onPlanUpdate={handlePlanUpdate}
          />
          <WaterCard 
            totalWaterLiters={aiPlan.waterLiters || 3.0}
            consumedWaterLiters={consumedWater}
            onPlanUpdate={handleWaterPlanUpdate}
          />
        </ScrollView>
      ) : (
        <AiNutritionPlanScreen
          onboardingData={onboardingData}
          userId={user?.id || ''}
          initialPlan={aiPlan}
          onPlanGenerated={(plan) => setAiPlan(plan)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#090C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
