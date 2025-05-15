import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';

export default function GamesStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Define header styles for individual game screens (Sudoku, TicTacToe, etc.)
  // The game selection screen (games/index.tsx) will have its header hidden by this layout.
  const headerBackgroundColor = isDark ? COLORS.surfaceDark : COLORS.primary;
  const headerTintColor = isDark ? COLORS.textLight : COLORS.white;

  return (
    <Stack
      screenOptions={{
        // Default header style for all screens within this game stack (e.g., Sudoku, 2048)
        // The GamesScreen (game selection) will override this with headerShown: false.
        headerStyle: {
          backgroundColor: headerBackgroundColor,
          shadowOpacity: 0 as any, // Flat header
          elevation: 0,
        } as any,
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.heading.fontFamily,
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index" // This refers to app/(tabs)/games/index.tsx (your GamesScreen)
        options={{
          headerShown: false, // Hide the Stack header for the game selection screen
          // because GamesScreen renders its own "Game Zone" header.
        }}
      />
      <Stack.Screen
        name="sudoku" // app/(tabs)/games/sudoku.tsx
        options={{
          title: 'Sudoku',
          // You can customize header per game, or let it use default screenOptions
        }}
      />
      <Stack.Screen
        name="tic-tac-toe" // app/(tabs)/games/tic-tac-toe.tsx (ensure filename matches)
        options={{
          title: 'Tic Tac Toe',
        }}
      />
      <Stack.Screen
        name="2048" // app/(tabs)/games/2048.tsx
        options={{
          title: '2048',
        }}
      />
      <Stack.Screen
        name="word-puzzle" // app/(tabs)/games/word-puzzle.tsx
        options={{
          title: 'Word Puzzle',
        }}
      />
      {/* Add other game screens here */}
    </Stack>
  );
}
