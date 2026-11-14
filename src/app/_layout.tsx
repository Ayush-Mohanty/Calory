import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto hiding splash screen during initialization
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090C10',
  },
});
