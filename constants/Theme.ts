// @/constants/Theme.ts - Enhanced with Dark Mode Support

export const COLORS = {
  // Core palette from your theme
  primary: '#FFA500',        // Orange/Yellow - Used for primary actions, user-inputted numbers, highlights
  secondary: '#14213D',      // Dark Blue - Used for some secondary UI elements or text
  accent: '#386641',         // Green - Used for major call-to-actions (like Start Game button, trophy icon)
  success: '#2DC653',       // Green - Success messages, completed actions
  warning: '#FCA311',       // Orange - Warning messages
  error: '#E63946',         // Red - Error messages

  // Light Theme Colors
  white: '#FFFFFF',
  lightGray: '#E5E7EB',     // Used for grid lines, some backgrounds
  gray: '#6B7280',          // Used for thicker grid box lines, secondary text
  darkGray: '#374151',      // Dark UI elements
  black: '#1F2937',         // Primary text in light mode

  // Dark Theme Colors
  backgroundDark: '#0F0F0F',      // Main dark background
  surfaceDark: '#1A1A1A',         // Cards, modals in dark mode
  surfaceSecondaryDark: '#2D2D2D', // Secondary surfaces
  textLight: '#FFFFFF',           // Primary text in dark mode
  textSecondaryDark: '#B0B0B0',   // Secondary text in dark mode
  borderDark: '#333333',          // Borders in dark mode

  // Adaptive Colors (automatically switch based on theme)
  background: '#F9FAFB',          // Main background (light mode)
  surface: '#FFFFFF',             // Card backgrounds (light mode)
  surfaceLight: '#FFFFFF',        // Light surface
  textPrimary: '#1F2937',         // Primary text (light mode)
  textSecondary: '#6B7280',       // Secondary text (light mode)
  textDark: '#1F2937',           // Dark text for light backgrounds

  // Game-specific colors
  cellBackground: '#FFFFFF',       // Background for individual cells
  fixedCellBackground: '#E5E7EB',  // Background for pre-filled cells
  selectedCellBackground: '#FFF3E0', // Light Orange - Background for selected cell
  relatedCellBackground: '#F3F4F6',  // Background for related cells
  errorCellBackground: '#FEE2E2',   // Light Red - Background for error cells
  gridLine: '#E5E7EB',            // Thin grid lines
  gridBoxLine: '#6B7280',         // Thick grid lines
  textFixed: '#1F2937',           // Text for fixed numbers
  textUser: '#FFA500',            // Text for user-entered numbers
  textError: '#E63946',           // Text for error state
  buttonDisabled: '#D1D5DB',      // Disabled button color

  // Additional colors for completeness
  highlight: '#F3F4F6',           // Highlight color
  successMuted: '#D1FAE5',        // Muted success color
  warningMuted: '#FEF3C7',        // Muted warning color
  errorMuted: '#FEE2E2',          // Muted error color
};

// Dark mode color overrides
export const DARK_COLORS = {
  ...COLORS,
  background: COLORS.backgroundDark,
  surface: COLORS.surfaceDark,
  surfaceLight: COLORS.surfaceDark,
  textPrimary: COLORS.textLight,
  textSecondary: COLORS.textSecondaryDark,
  cellBackground: COLORS.surfaceSecondaryDark,
  fixedCellBackground: COLORS.surfaceDark,
  selectedCellBackground: '#4A3A00', // Darker orange background
  relatedCellBackground: COLORS.surfaceSecondaryDark,
  errorCellBackground: '#4A1A1A',   // Dark red background
  gridLine: COLORS.borderDark,
  gridBoxLine: COLORS.textSecondaryDark,
  lightGray: COLORS.surfaceSecondaryDark,
  white: COLORS.surfaceDark,
  black: COLORS.textLight,
};

// Function to get theme-appropriate colors
export const getThemeColors = (isDark: boolean) => {
  return isDark ? DARK_COLORS : COLORS;
};

export const TYPOGRAPHY = {
  heading: {
    fontFamily: 'Merriweather-Bold',
  },
  body: {
    fontFamily: 'OpenSans-Regular',
  },
  emphasis: {
    fontFamily: 'OpenSans-SemiBold',
  },
};

// Spacing constants for consistent design
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius constants
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 50,
};

// Shadow presets
export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  small: 320,
  medium: 768,
  large: 1024,
  xlarge: 1200,
};

// Z-index levels
export const Z_INDEX = {
  dropdown: 1000,
  modal: 2000,
  tooltip: 3000,
  notification: 4000,
};

// Common styles that can be reused
export const COMMON_STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  shadow: SHADOWS.medium,
};

// Theme-aware common styles
export const getCommonStyles = (isDark: boolean) => {
  const colors = getThemeColors(isDark);

  return {
    ...COMMON_STYLES,
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      ...SHADOWS.medium,
    },
    text: {
      color: colors.textPrimary,
      fontFamily: TYPOGRAPHY.body.fontFamily,
    },
    heading: {
      color: colors.textPrimary,
      fontFamily: TYPOGRAPHY.heading.fontFamily,
    },
  };
};