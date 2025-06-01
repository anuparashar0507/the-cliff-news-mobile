import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
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
  const [systemTheme, setSystemTheme] = useState(systemColorScheme);

  // FIXED: Better dark mode calculation
  const isDarkMode =
    themeMode === 'dark' || (themeMode === 'system' && systemTheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  // FIXED: Better system theme change handling
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('System theme changed to:', colorScheme);
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // FIXED: Update system theme when it changes
  useEffect(() => {
    setSystemTheme(systemColorScheme);
  }, [systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedThemeMode &&
        ['light', 'dark', 'system'].includes(savedThemeMode)
      ) {
        setThemeModeState(savedThemeMode as ThemeMode);
      } else {
        setThemeModeState('system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
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

  const colors = getThemeColors(isDarkMode);

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    toggleTheme,
    setThemeMode,
    colors,
    isLoaded,
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
