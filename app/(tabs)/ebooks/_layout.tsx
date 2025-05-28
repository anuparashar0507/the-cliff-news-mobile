// app/(tabs)/ebooks/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Theme';

export default function EBooksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // We handle headers in individual screens
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right', // Smooth navigation animations
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'E-Books',
        }}
      />
      <Stack.Screen
        name="reader"
        options={{
          title: 'PDF Reader',
          presentation: 'modal', // Makes reader feel like a separate experience
        }}
      />
    </Stack>
  );
}
