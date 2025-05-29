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
          // shadowOpacity: 0,
          // elevation: 0,
        },
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.heading.fontFamily,
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        headerBackTitle: 'Games', // iOS back button text
        // headerBackTitleVisible: false, // Hide back title on iOS
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
        }}
      />
      <Stack.Screen
        name="tic-tac-toe"
        options={{
          title: 'Tic Tac Toe',
          headerShown: true, // Show header with back button
        }}
      />
      <Stack.Screen
        name="2048"
        options={{
          title: '2048',
          headerShown: true, // Show header with back button
        }}
      />
      <Stack.Screen
        name="word-puzzle"
        options={{
          title: 'Word Puzzle',
          headerShown: true, // Show header with back button
        }}
      />
    </Stack>
  );
}
