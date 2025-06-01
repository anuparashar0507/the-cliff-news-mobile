// context/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS, getThemeColors } from '@/constants/Theme';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof COLORS;
  isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'system',
  toggleTheme: () => {},
  setThemeMode: () => {},
  colors: COLORS,
  isLoaded: false,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'themeMode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate if dark mode should be active
  const isDarkMode =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    if (isLoaded && themeMode === 'system') {
      // System theme changed, no need to save anything
      console.log('System theme changed to:', systemColorScheme);
    }
  }, [systemColorScheme, themeMode, isLoaded]);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedThemeMode &&
        ['light', 'dark', 'system'].includes(savedThemeMode)
      ) {
        setThemeModeState(savedThemeMode as ThemeMode);
      } else {
        // No saved preference, default to system
        setThemeModeState('system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system theme
      setThemeModeState('system');
    } finally {
      setIsLoaded(true);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log('Theme saved:', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    console.log('Setting theme mode to:', mode);
    setThemeModeState(mode);
    saveThemePreference(mode);
  };

  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Get theme-appropriate colors
  const colors = getThemeColors(isDarkMode);

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    toggleTheme,
    setThemeMode,
    colors,
    isLoaded,
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
