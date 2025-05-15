// @/constants/Theme.js

export const COLORS = {
  // Core palette from your theme
  primary: '#FFA500',        // Orange/Yellow - Used for primary actions, user-inputted numbers, highlights
  secondary: '#14213D',      // Dark Blue - Used for some secondary UI elements or text
  accent: '#386641',         // Green - Used for major call-to-actions (like Start Game button, trophy icon)
  success: '#2DC653',       // Green - Retained for potential future use (e.g., success messages)
  warning: '#FCA311',       // Orange - Retained for potential future use
  error: '#E63946',         // Red - Used for error text

  // Neutral colors from your theme
  white: '#FFFFFF',
  lightGray: '#E5E7EB',     // Used for grid lines, some backgrounds
  gray: '#6B7280',          // Used for thicker grid box lines, secondary text
  darkGray: '#374151',      // Retained, could be used for very dark UI elements if needed
  black: '#1F2937',         // Used for primary text, fixed numbers

  // Specific mappings for Sudoku game UI elements
  background: '#F9FAFB',      // Main game and start screen background
  cellBackground: '#FFFFFF',   // Background for individual Sudoku cells

  fixedCellBackground: '#E5E7EB', // Background for pre-filled (fixed) Sudoku cells (User's lightGray)

  selectedCellBackground: '#FFF3E0', // Light Orange - Background for the currently selected cell (derived from your primary)
  relatedCellBackground: '#F3F4F6',  // User's highlight - Background for cells in the same row/col/box as selected

  errorCellBackground: '#FEE2E2',   // Light Red - Background for cells with incorrect user input (derived from your error color)

  gridLine: '#E5E7EB',        // Thin lines between individual cells (User's lightGray)
  gridBoxLine: '#6B7280',     // Thicker lines for the 3x3 subgrid boxes (User's gray)

  textPrimary: '#1F2937',     // Primary text color (User's black)
  textSecondary: '#6B7280',   // Secondary text color (User's gray)
  textFixed: '#1F2937',       // Text color for fixed numbers (User's black, for strong visibility)
  textUser: '#FFA500',        // Text color for numbers entered by the user (User's primary)
  textError: '#E63946',       // Text color for numbers in error state (User's error)
  textLight: '#FFFFFF',       // Text color for use on dark backgrounds (e.g., on buttons)

  buttonDisabled: '#D1D5DB', // A medium-light gray for disabled button states (e.g., Tailwind's gray-300)

  // Below are from your original theme file, retained for completeness if other parts of your app use them.
  backgroundDark: '#121212', // Not directly used by Sudoku in this version
  highlight: '#F3F4F6', // Used for relatedCellBackground
  // highlightDark: '#2A2A2A',
  // shadow: 'rgba(0, 0, 0, 0.1)',
  textDark: '#1F2937', // Same as 'black' or 'textPrimary'
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1F1F1F',
  successMuted: '#2DC653',
};

// The TYPOGRAPHY object from your theme file.
// The Sudoku game (sudoku_game_enhanced_v2) currently defines font families
// directly in its StyleSheet. If you want to centralize font management,
// you would need to modify the Sudoku game's styles to refer to this TYPOGRAPHY object.
export const TYPOGRAPHY = {
  heading: {
    fontFamily: 'Merriweather-Bold', // Make sure this font is loaded in your app
  },
  body: {
    fontFamily: 'OpenSans-Regular', // Make sure this font is loaded in your app
  },
  emphasis: {
    fontFamily: 'OpenSans-SemiBold', // Make sure this font is loaded in your app
  },
};

// Example of how you might load fonts in your App.js or a similar entry point:
/*
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Merriweather-Bold': require('./assets/fonts/Merriweather-Bold.ttf'),
    'OpenSans-Regular': require('./assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-SemiBold': require('./assets/fonts/OpenSans-SemiBold.ttf'),
    // Add other weights/styles if your TYPOGRAPHY object or styles use them
  });

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  // ... rest of your app
}
*/
