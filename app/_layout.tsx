import React, { useEffect, useState } from 'react';
import { Stack, SplashScreen as ExpoRouterSplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
} from '@expo-google-fonts/open-sans';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import SplashScreenComponent from '@/components/splash';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// FIXED: Import OneSignal with proper Expo Go detection
let OneSignal: any = null;
let LogLevel: any = null;

// Check if we're in Expo Go or development build
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const onesignalModule = require('react-native-onesignal');
    OneSignal = onesignalModule.OneSignal;
    LogLevel = onesignalModule.LogLevel;
  } catch (error) {
    console.log('OneSignal module not available in Expo Go:', error);
  }
}

// Prevent native splash screen from auto-hiding
ExpoRouterSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Merriweather-Regular': Merriweather_400Regular,
    'Merriweather-Bold': Merriweather_700Bold,
    'OpenSans-Regular': OpenSans_400Regular,
    'OpenSans-SemiBold': OpenSans_600SemiBold,
  });

  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize OneSignal only if not in Expo Go
  useEffect(() => {
    if (!isExpoGo && Platform.OS !== 'web' && OneSignal) {
      console.log('Starting OneSignal initialization in development build');
      initializeOneSignal();
    } else {
      console.log(
        'Skipping OneSignal initialization (running in Expo Go or web)'
      );
    }
  }, []);

  const initializeOneSignal = async () => {
    if (!OneSignal || !LogLevel) {
      console.log('OneSignal not available');
      return;
    }

    try {
      console.log('OneSignal initialization function called');

      // Get the OneSignal App ID from Expo constants
      const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId || '';

      if (!oneSignalAppId) {
        console.error('OneSignal App ID is not configured correctly');
        return;
      }

      console.log('Using OneSignal App ID:', oneSignalAppId);

      // Configure OneSignal for the news app use case
      OneSignal.Debug.setLogLevel(LogLevel.Verbose); // Shows all logs for debugging

      // Initialize OneSignal
      await OneSignal.initialize(oneSignalAppId);
      console.log('OneSignal initialized successfully');

      // Force notification permission prompt to appear immediately
      // for testing purposes
      const hasPermission = await OneSignal.Notifications.hasPermission;
      console.log('Current notification permission status:', hasPermission);

      if (!hasPermission) {
        console.log('Requesting notification permission');
        await OneSignal.Notifications.requestPermission(true);
      }

      // Check again after request
      const permissionAfter = await OneSignal.Notifications.hasPermission;
      console.log('Permission status after request:', permissionAfter);

      // Use device ID for identification since we don't have user accounts
      const deviceId = Constants.installationId || `device_${Date.now()}`;
      await OneSignal.login(deviceId);
      console.log('OneSignal login completed with device ID:', deviceId);

      // Add device info tags
      await OneSignal.User.addTags({
        app_platform: Platform.OS,
        app_version: Constants.expoConfig?.version || '1.0.0',
        device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
        install_date: new Date().toISOString().split('T')[0],
        build_type: isExpoGo ? 'expo_go' : 'development',
      });
      console.log('Added device info tags to OneSignal');

      // Send a test event to verify everything is working
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      console.log('OneSignal setup complete');
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  };

  useEffect(() => {
    console.log(
      'RootLayout useEffect triggered. Fonts loaded:',
      fontsLoaded,
      'Font error:',
      !!fontError,
      'Running in:',
      isExpoGo ? 'Expo Go' : 'Development Build'
    );

    async function prepareApp() {
      try {
        if (fontsLoaded || fontError) {
          console.log(
            'Fonts are ready or error occurred. Preparing to show main app.'
          );

          // Artificial delay to ensure custom splash is visible for a moment
          await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 seconds delay

          setAppIsReady(true);
          console.log(
            'setAppIsReady(true) called. Hiding native splash screen.'
          );
          await ExpoRouterSplashScreen.hideAsync();
          console.log('Native splash screen hidden.');
        } else {
          console.log('Fonts not yet ready.');
        }
      } catch (e) {
        console.warn('Error during app preparation:', e);
        // Still try to make app ready and hide native splash to avoid getting stuck
        if (fontsLoaded || fontError) {
          setAppIsReady(true);
          await ExpoRouterSplashScreen.hideAsync();
        }
      }
    }

    prepareApp();
  }, [fontsLoaded, fontError]);

  if (!appIsReady) {
    console.log('App not ready, rendering SplashScreenComponent.');
    if (!SplashScreenComponent) {
      console.error(
        'SplashScreenComponent is not imported correctly! Check the path.'
      );
    }
    return <SplashScreenComponent />;
  }

  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  console.log('App is ready, rendering main app structure.');
  return (
    <ThemeProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        <StatusBar style="auto" />
      </AppProvider>
    </ThemeProvider>
  );
}
