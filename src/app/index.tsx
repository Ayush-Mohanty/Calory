import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUser } from '@/services/auth';
import { OnboardingStepForm } from '@/components/onboarding/OnboardingStepForm';
import {
  getOnboardingFromLocalStorage,
  saveOnboardingToLocalStorage,
  OnboardingData,
} from '@/services/storage';
import { AppColors } from '@/constants/colors';

export default function IndexScreen() {
  const { user } = useUser();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboardingFromLocalStorage()
      .then((data) => setOnboardingDone(!!data))
      .catch(() => setOnboardingDone(false));
  }, []);

  // While checking onboarding status
  if (onboardingDone === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  // If onboarding not completed yet, show Onboarding form
  if (!onboardingDone) {
    const displayName = user?.fullName || 'Athlete';
    return (
      <OnboardingStepForm
        initialName={displayName}
        onComplete={async (data: OnboardingData) => {
          await saveOnboardingToLocalStorage(data);
          setOnboardingDone(true);
        }}
      />
    );
  }

  // Onboarded -> Redirect straight to home dashboard
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#090C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
