// In app/(tabs)/_layout.tsx - Update the entire component:

import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Newspaper, FileText, Gamepad2, BookOpen } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { isDarkMode, colors } = useTheme();

  const activeTabColor = colors.primary;
  const inactiveTabColor = colors.textSecondary;
  const tabBackgroundColor = colors.surface;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTabColor,
        tabBarInactiveTintColor: inactiveTabColor,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: tabBackgroundColor,
            borderTopColor: colors.textSecondary,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
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
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    elevation: 8,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    // Remove shadowColor - it's now dynamic
  },
  tabBarLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
});
