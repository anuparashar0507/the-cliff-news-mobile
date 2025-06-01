// app/(tabs)/_layout.tsx (UPDATED)
import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Newspaper, FileText, Gamepad2, BookOpen } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeTabColor = COLORS.primary;
  const inactiveTabColor = isDark ? COLORS.gray : COLORS.secondary;
  const tabBackgroundColor = isDark ? COLORS.surfaceDark : COLORS.surfaceLight;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTabColor,
        tabBarInactiveTintColor: inactiveTabColor,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: tabBackgroundColor,
            borderTopColor: isDark ? COLORS.darkGray : COLORS.lightGray,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false, // All headers managed by individual screens
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Newspaper
              size={26}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="epaper"
        options={{
          title: 'E-Paper',
          tabBarIcon: ({ color, focused }) => (
            <FileText size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="ebooks"
        options={{
          title: 'E-Books',
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color, focused }) => (
            <Gamepad2 size={28} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 90 : 70, // Slightly increased for better UX
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    elevation: 8, // Better shadow on Android
    shadowColor: COLORS.primary, // iOS shadow
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.6,
  },
  tabBarLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
});
