import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';

export default function EBooksLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const headerBackgroundColor = isDark ? COLORS.surfaceDark : COLORS.primary;
  const headerTintColor = isDark ? COLORS.textLight : COLORS.white;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: headerBackgroundColor,
          // shadowOpacity: 0,
          // elevation: 0,
        },
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.heading.fontFamily,
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        headerBackTitle: 'E-Books',
        // headerBackTitleVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // EBooks main screen manages its own header
        }}
      />
      <Stack.Screen
        name="reader"
        options={{
          headerShown: false, // PDF reader has custom header
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
