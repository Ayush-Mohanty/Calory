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

const STORAGE_KEYS = {
  USER_SESSION: '@calory_user_session',
  USER_PROFILE: '@calory_user_profile',
  LAST_AUTH_TIMESTAMP: '@calory_last_auth',
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
 * Clear user session and profile from local storage (used on Sign Out).
 */
export async function clearUserFromLocalStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_SESSION,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.LAST_AUTH_TIMESTAMP,
    ]);
  } catch (error) {
    console.error('[Storage] Error clearing local storage:', error);
  }
}
