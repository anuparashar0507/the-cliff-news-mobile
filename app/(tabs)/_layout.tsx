import React from 'react';
import { Tabs, Stack } from 'expo-router'; // Import Stack if you might need it for other direct children
import { StyleSheet, Platform } from 'react-native';
import { Newspaper, FileText, Gamepad2 } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Define colors based on theme to keep it clean
  const activeTabColor = COLORS.primary; // Your primary color for active tabs
  const inactiveTabColor = isDark ? COLORS.gray : COLORS.secondary;
  const tabBackgroundColor = isDark ? COLORS.surfaceDark : COLORS.surfaceLight;
  const headerDefaultBgColor = isDark ? COLORS.surfaceDark : COLORS.primary; // Default header bg for screens in tabs that show a header
  const headerDefaultTintColor = isDark ? COLORS.textLight : COLORS.white;

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
        headerStyle: [
          styles.headerBase, // Base style for header (e.g., removing shadow)
          { backgroundColor: headerDefaultBgColor },
        ],
        headerTitleStyle: [
          styles.headerTitleBase, // Base style for header title
          { color: headerDefaultTintColor },
        ],
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index" // Corresponds to app/(tabs)/index.tsx
        options={{
          title: 'Home', // Tab label and default header title
          headerShown: false, // Home screen (WebView) likely manages its own top space
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
        name="epaper" // Corresponds to app/(tabs)/epaper.tsx
        options={{
          title: 'E-Paper', // Tab label and default header title
          headerShown: false, // E-Paper screen (WebView) likely manages its own top space
          tabBarIcon: ({ color, focused }) => (
            <FileText size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="games" // This refers to the 'games' route segment.
        // It could be app/(tabs)/games.tsx or a directory app/(tabs)/games/
        options={{
          title: 'Games', // This sets the TAB BAR LABEL.
          tabBarIcon: ({ color, focused }) => (
            <Gamepad2 size={28} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 85 : 65, // Slightly taller for better touch area
    paddingBottom: Platform.OS === 'ios' ? 25 : 8, // More padding at bottom for iOS notch/home indicator
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabel: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 11,
    // marginTop: -5, // Removed as it can cause layout issues, adjust paddingBottom in tabBarStyle instead
    // marginBottom: 5,
  },
  headerBase: {
    // Base style for headers shown by this Tabs navigator
    elevation: 0, // Remove shadow on Android
    shadowOpacity: 0, // Remove shadow on iOS
    borderBottomWidth: 0, // Remove bottom border line
  },
  headerTitleBase: {
    // Base style for header titles shown by this Tabs navigator
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
  },
});
