import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { OnboardingStepForm } from '@/components/onboarding/OnboardingStepForm';
import { AiNutritionPlanScreen } from '@/components/plan/AiNutritionPlanScreen';
import {
  getUserFromLocalStorage,
  clearUserFromLocalStorage,
  getOnboardingFromLocalStorage,
  saveOnboardingToLocalStorage,
  getAiPlanFromLocalStorage,
  StoredUser,
  OnboardingData,
} from '@/services/storage';
import {
  saveOnboardingToFirestore,
  checkUserOnboardingStatusInFirestore,
  getAiPlanFromFirestore,
} from '@/services/firebase';
import { AiNutritionPlan } from '@/services/gemini';
import { AppColors } from '@/constants/colors';

export default function HomeScreen() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [localUser, setLocalUser] = useState<StoredUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Onboarding state
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  // AI Nutrition Plan state
  const [aiPlan, setAiPlan] = useState<AiNutritionPlan | null>(null);

  // Load user profile from storage
  useEffect(() => {
    getUserFromLocalStorage().then((stored) => {
      setLocalUser(stored);
    });
  }, [user]);

  // Check onboarding & AI plan status from AsyncStorage and Firestore
  useEffect(() => {
    async function checkStatus() {
      if (!isSignedIn || !user) {
        setIsOnboardingChecked(true);
        return;
      }

      try {
        // 1. Check local storage first (instant)
        const [localData, localPlan] = await Promise.all([
          getOnboardingFromLocalStorage(),
          getAiPlanFromLocalStorage(),
        ]);

        if (localData) {
          setOnboardingData(localData);
          setIsOnboardingCompleted(true);
          if (localPlan) {
            setAiPlan(localPlan);
          }
          setIsOnboardingChecked(true);
          return;
        }

        // 2. Check Firestore if not found locally
        const firestoreStatus = await checkUserOnboardingStatusInFirestore(user.id);
        if (firestoreStatus) {
          setIsOnboardingCompleted(true);
          const cloudPlan = await getAiPlanFromFirestore(user.id);
          if (cloudPlan) {
            setAiPlan(cloudPlan);
          }
        }
      } catch (err) {
        console.error('Error checking onboarding and plan status:', err);
      } finally {
        setIsOnboardingChecked(true);
      }
    }

    if (isLoaded) {
      checkStatus();
    }
  }, [isLoaded, isSignedIn, user]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      // 1. Save to AsyncStorage
      await saveOnboardingToLocalStorage(data);
      setOnboardingData(data);

      // 2. Sync to Firebase Firestore
      if (user?.id) {
        await saveOnboardingToFirestore(user.id, data);
      }

      setIsOnboardingCompleted(true);
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await clearUserFromLocalStorage();
      await signOut();
      setIsOnboardingCompleted(false);
      setOnboardingData(null);
      setAiPlan(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Loading state while Clerk & Onboarding status initialize
  if (!isLoaded || (isSignedIn && !isOnboardingChecked)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  // 1. If user is NOT signed in -> show Dribbble SignIn / SignUp screen
  if (!isSignedIn) {
    return <AuthScreen />;
  }

  const displayName =
    user?.fullName ||
    localUser?.fullName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Athlete';

  const userEmail =
    user?.primaryEmailAddress?.emailAddress || localUser?.email || '';
  const avatarUrl = user?.imageUrl || localUser?.photoUrl;
  const userId = user?.id || localUser?.id || '';

  // 2. If user IS signed in, but has NOT completed onboarding -> Show Step Form!
  if (!isOnboardingCompleted || !onboardingData) {
    return (
      <OnboardingStepForm
        initialName={displayName}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // 3. User authenticated & completed onboarding -> Redirect to Tabs Navigation
  return <Redirect href="/(tabs)/home" />;
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
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0D1117',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  userNavAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    marginRight: 10,
  },
  userNavAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161B26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.primaryBorder,
    marginRight: 10,
  },
  userTextWrap: {
    flex: 1,
  },
  userNavName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userNavEmail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  signOutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});
