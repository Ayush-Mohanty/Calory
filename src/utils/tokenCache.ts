import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { TokenCache } from '@clerk/expo';

const TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => {
        console.warn(`[TokenCache] Operation timed out after ${timeoutMs}ms, using fallback`);
        resolve(fallbackValue);
      }, timeoutMs)
    ),
  ]);
}

/**
 * Resilient TokenCache for Clerk:
 * - Supports Web (localStorage)
 * - Uses SecureStore on Native with a 2.5s safety timeout
 * - Automatically falls back to AsyncStorage if SecureStore hangs or fails
 *   (e.g., when running on Expo Go or when native keychain is slow)
 */
export const resilientTokenCache: TokenCache = {
  getToken: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }

      // Try SecureStore first with a timeout
      const secureResult = await withTimeout(
        SecureStore.getItemAsync(key).catch((e) => {
          console.warn('[TokenCache] SecureStore.getItemAsync failed:', e?.message);
          return null;
        }),
        TIMEOUT_MS,
        null
      );

      if (secureResult !== null) {
        return secureResult;
      }

      // Fallback: try AsyncStorage
      return await AsyncStorage.getItem(key).catch(() => null);
    } catch (err) {
      console.error('[TokenCache] Error retrieving token:', err);
      return null;
    }
  },

  saveToken: async (key: string, token: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, token);
        }
        return;
      }

      // Try SecureStore with timeout
      let saved = false;
      try {
        await withTimeout(
          SecureStore.setItemAsync(key, token),
          TIMEOUT_MS,
          undefined
        );
        saved = true;
      } catch (e: any) {
        console.warn('[TokenCache] SecureStore.setItemAsync error:', e?.message);
      }

      // Always backup to AsyncStorage in case SecureStore failed or timed out
      try {
        await AsyncStorage.setItem(key, token);
      } catch (err) {
        console.warn('[TokenCache] AsyncStorage fallback save failed:', err);
      }
    } catch (err) {
      console.error('[TokenCache] Error saving token:', err);
    }
  },

  clearToken: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }

      await Promise.allSettled([
        withTimeout(SecureStore.deleteItemAsync(key).catch(() => {}), TIMEOUT_MS, undefined),
        AsyncStorage.removeItem(key).catch(() => {}),
      ]);
    } catch (err) {
      console.error('[TokenCache] Error clearing token:', err);
    }
  },
};
