import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';

export default function GamesStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const headerBackgroundColor = isDark ? COLORS.surfaceDark : COLORS.primary;
  const headerTintColor = isDark ? COLORS.textLight : COLORS.white;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: headerBackgroundColor,
        },
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.heading.fontFamily,
          fontSize: 18,
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
        headerBackTitle: 'Games', // iOS back button text
        headerBackVisible: true, // Show back title on iOS
        animation: 'slide_from_right',
        // Ensure back button is always visible
        headerLeft: undefined, // Let the stack handle the back button
        gestureEnabled: true, // Enable swipe back gesture
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Games selection screen manages its own header
        }}
      />
      <Stack.Screen
        name="sudoku"
        options={{
          title: 'Sudoku',
          headerShown: true, // Show header with back button
          headerBackVisible: true, // Ensure back button is visible
        }}
      />
      <Stack.Screen
        name="tic-tac-toe"
        options={{
          title: 'Tic Tac Toe',
          headerShown: true, // Show header with back button
          headerBackVisible: true, // Ensure back button is visible
        }}
      />
      <Stack.Screen
        name="2048"
        options={{
          title: '2048',
          headerShown: true, // Show header with back button
          headerBackVisible: true, // Ensure back button is visible
        }}
      />
      <Stack.Screen
        name="word-puzzle"
        options={{
          title: 'Word Puzzle',
          headerShown: true, // Show header with back button
          headerBackVisible: true, // Ensure back button is visible
        }}
      />
    </Stack>
  );
}
