import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

import { saveUserToLocalStorage } from '@/services/storage';
import { saveUserToFirestore } from '@/services/firebase';

// Prevent auto hiding splash screen during initialization
SplashScreen.preventAutoHideAsync().catch(() => {});

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Always dismiss the splash screen as soon as Clerk is loaded
  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoaded]);

  // When user is signed in, sync basic info to LocalStorage & Firebase Firestore
  useEffect(() => {
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || '';
      const fullName =
        user.fullName ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'User';

      const userProfile = {
        id: user.id,
        email,
        fullName,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        photoUrl: user.imageUrl || '',
        lastLoginAt: Date.now(),
      };

      saveUserToLocalStorage(userProfile).then(() => {
        console.log('[AuthGate] User saved to LocalStorage');
      });

      saveUserToFirestore({
        id: user.id,
        email,
        fullName,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        photoUrl: user.imageUrl || '',
        provider: user.externalAccounts?.[0]?.provider || 'clerk',
      }).then((res) => {
        if (res.success) {
          console.log('[AuthGate] User synced to Firebase Firestore: users/' + user.id);
        }
      });
    }
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Always render Slot so Expo Router routes (src/app/index.tsx) mount correctly
  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  if (!clerkPublishableKey) {
    console.error(
      'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.'
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey || ''}
      tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
