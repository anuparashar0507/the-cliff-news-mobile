import React, { useEffect, useState } from 'react';
import { Stack, SplashScreen as ExpoRouterSplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import { useFrameworkReady } from '@/hooks/useFrameworkReady'; // Assuming this is a custom hook
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
// Ensure this path is absolutely correct. Example: '@/components/SplashScreenComponent'
import SplashScreenComponent from '@/components/splash';

// Prevent native splash screen from auto-hiding
ExpoRouterSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // const frameworkReady = useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Merriweather-Regular': Merriweather_400Regular,
    'Merriweather-Bold': Merriweather_700Bold,
    'OpenSans-Regular': OpenSans_400Regular,
    'OpenSans-SemiBold': OpenSans_600SemiBold,
  });

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    console.log(
      'RootLayout useEffect triggered. Fonts loaded:',
      fontsLoaded,
      'Font error:',
      !!fontError
    );

    async function prepareApp() {
      try {
        if (fontsLoaded || fontError) {
          console.log(
            'Fonts are ready or error occurred. Preparing to show main app.'
          );

          // Artificial delay to ensure custom splash is visible for a moment (for debugging)
          // Remove this for production if not desired.
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
    // CRITICAL: Verify that '@/assets/splash' correctly imports your SplashScreenComponent file.
    // If this path is wrong, SplashScreenComponent might be undefined, and nothing will render here.
    if (!SplashScreenComponent) {
      console.error(
        'SplashScreenComponent is not imported correctly! Check the path.'
      );
      // Optionally return a basic fallback loading view if SplashScreenComponent is missing
      // return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Loading...</Text></View>;
    }
    return <SplashScreenComponent />;
  }

  if (fontError) {
    console.error('Font loading error:', fontError);
    // Optionally, render an error message to the user
  }

  console.log('App is ready, rendering main app structure.');
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
    </AppProvider>
  );
}
