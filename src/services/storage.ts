import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredUser {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  lastLoginAt: number;
}

export interface OnboardingData {
  gender: 'male' | 'female' | 'other';
  goal: 'lose_weight' | 'maintain' | 'gain_weight';
  workoutDays: '2-3_days' | '3-4_days' | '5-6_days';
  birthDate: {
    day: number;
    month: number;
    year: number;
  };
  heightFeet: number;
  heightInches: number;
  weightKg: number;
  completedAt: number;
}

const STORAGE_KEYS = {
  USER_SESSION: '@calory_user_session',
  USER_PROFILE: '@calory_user_profile',
  LAST_AUTH_TIMESTAMP: '@calory_last_auth',
  ONBOARDING_DATA: '@calory_onboarding_data',
  ONBOARDING_COMPLETED: '@calory_onboarding_completed',
  AI_NUTRITION_PLAN: '@calory_ai_nutrition_plan',
};

/**
 * Save authenticated user session and profile to local storage.
 * Ensures the app remembers the user across restarts.
 */
export async function saveUserToLocalStorage(user: StoredUser): Promise<void> {
  try {
    const payload = JSON.stringify(user);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.USER_SESSION, user.id],
      [STORAGE_KEYS.USER_PROFILE, payload],
      [STORAGE_KEYS.LAST_AUTH_TIMESTAMP, Date.now().toString()],
    ]);
  } catch (error) {
    console.error('[Storage] Error saving user to local storage:', error);
  }
}

/**
 * Retrieve the cached user profile from local storage.
 */
export async function getUserFromLocalStorage(): Promise<StoredUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch (error) {
    console.error('[Storage] Error getting user from local storage:', error);
    return null;
  }
}

/**
 * Check if a valid user session exists in local storage.
 */
export async function isUserLocallyStored(): Promise<boolean> {
  try {
    const sessionId = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return !!sessionId;
  } catch (error) {
    console.error('[Storage] Error checking local session:', error);
    return false;
  }
}

/**
 * Save user onboarding step form details to AsyncStorage.
 */
export async function saveOnboardingToLocalStorage(data: OnboardingData): Promise<void> {
  try {
    const payload = JSON.stringify(data);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ONBOARDING_DATA, payload],
      [STORAGE_KEYS.ONBOARDING_COMPLETED, 'true'],
    ]);
  } catch (error) {
    console.error('[Storage] Error saving onboarding data to local storage:', error);
  }
}

/**
 * Retrieve user onboarding step form details from AsyncStorage.
 */
export async function getOnboardingFromLocalStorage(): Promise<OnboardingData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingData;
  } catch (error) {
    console.error('[Storage] Error getting onboarding data from local storage:', error);
    return null;
  }
}

/**
 * Check if the user has already completed the onboarding step form.
 */
export async function isOnboardingCompletedLocally(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed === 'true';
  } catch (error) {
    console.error('[Storage] Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Save generated AI nutrition plan to local storage.
 */
export async function saveAiPlanToLocalStorage(plan: any): Promise<void> {
  try {
    const payload = JSON.stringify(plan);
    await AsyncStorage.setItem(STORAGE_KEYS.AI_NUTRITION_PLAN, payload);
  } catch (error) {
    console.error('[Storage] Error saving AI plan to local storage:', error);
  }
}

/**
 * Retrieve cached AI nutrition plan from local storage.
 */
export async function getAiPlanFromLocalStorage(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AI_NUTRITION_PLAN);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Storage] Error getting AI plan from local storage:', error);
    return null;
  }
}

/**
 * Clear user session, profile, onboarding, and AI plan from local storage (used on Sign Out).
 */
export async function clearUserFromLocalStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_SESSION,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.LAST_AUTH_TIMESTAMP,
      STORAGE_KEYS.ONBOARDING_DATA,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.AI_NUTRITION_PLAN,
    ]);
  } catch (error) {
    console.error('[Storage] Error clearing local storage:', error);
  }
}

