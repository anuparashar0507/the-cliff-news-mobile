import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  withDelay,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useColorScheme } from 'react-native';

// This component will be rendered by RootLayout.js
export default function SplashScreenComponent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation shared values
  const mainContentOpacity = useSharedValue(0);
  const mainContentScale = useSharedValue(0.8); // Start slightly smaller

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20); // Start slightly down

  const bottomContentOpacity = useSharedValue(0);
  const pulseBarScale = useSharedValue(1);

  useEffect(() => {
    // Main content (logo area) animation
    mainContentOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    mainContentScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    // Title animation (delayed)
    titleOpacity.value = withTiming(
      1,
      { duration: 700, easing: Easing.out(Easing.ease) },
      () => {
        // Start title translate animation after opacity starts
        titleTranslateY.value = withTiming(0, {
          duration: 700,
          easing: Easing.out(Easing.ease),
        });
      }
    );
    // Apply delay directly to withTiming for title animations
    titleOpacity.value = withTiming(
      1,
      { duration: 700, easing: Easing.out(Easing.ease) },
      () => {
        titleTranslateY.value = withDelay(
          300,
          withTiming(0, {
            duration: 700,
            easing: Easing.out(Easing.ease),
          })
        );
      }
    );
    titleOpacity.value = withDelay(
      300,
      withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );
    // Bottom content (subtitle + pulse bar) animation (further delayed)
    bottomContentOpacity.value = withDelay(
      1000,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    // Pulsing bar animation
    pulseBarScale.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Loop indefinitely
      true // Reverse the animation
    );
  }, []); // Empty dependency array, runs once on mount

  // Animated styles
  const animatedMainContentStyle = useAnimatedStyle(() => {
    return {
      opacity: mainContentOpacity.value,
      transform: [{ scale: mainContentScale.value }],
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    };
  });

  const animatedBottomContentStyle = useAnimatedStyle(() => {
    return {
      opacity: bottomContentOpacity.value,
    };
  });

  const animatedPulseBarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: pulseBarScale.value }],
    };
  });

  // Determine colors and logo based on theme
  // Web example uses 'bg-cliff-dark'. Let's map this to your theme.
  // For a news app, a clean background is often good.
  // Light mode: COLORS.background (e.g., F9FAFB)
  // Dark mode: COLORS.backgroundDark (e.g., 121212) or COLORS.secondary if it's dark enough
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;

  // Text color needs to contrast with the chosen background
  const primaryTextColor = isDark ? COLORS.textLight : COLORS.textDark;
  const secondaryTextColor = isDark ? COLORS.gray : COLORS.gray; // Subtitle color

  // Logo selection (same logic as before, adjust based on your actual logo designs)
  // Assuming 10x10_DARK.jpg is for light backgrounds (has light text/elements)
  // Assuming 10x10_WHITW.jpg is for dark backgrounds (has dark text/elements)
  const logoSource = isDark
    ? require('@/assets/images/10x10_WHITW.png') // Use the logo that looks good on a dark background
    : require('@/assets/images/10x10_DARK.png'); // Use the logo that looks good on a light background

  // Color for the pulsing bar, from web example 'bg-cliff-orange'
  const pulseBarColor = COLORS.primary; // Your theme's primary orange/yellow

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Main content: Logo */}
      <Animated.View style={[styles.logoContainer, animatedMainContentStyle]}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[styles.title, { color: primaryTextColor }, animatedTitleStyle]}
      >
        THE CLIFF NEWS
      </Animated.Text>

      {/* Bottom content: Subtitle and Pulsing Bar */}
      <Animated.View
        style={[styles.bottomContainer, animatedBottomContentStyle]}
      >
        <Animated.View
          style={[
            styles.pulseBar,
            { backgroundColor: pulseBarColor },
            animatedPulseBarStyle,
          ]}
        />
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Your daily source of news
        </Text>
        <ActivityIndicator
          size={Platform.OS === 'ios' ? 'small' : 'large'}
          color={primaryTextColor}
          style={styles.loader}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Vertically center main content blocks
    alignItems: 'center',
  },
  logoContainer: {
    // Container for the logo, matches framer-motion's first animated div
    alignItems: 'center',
    // marginBottom: 4, // from web example, adjust as needed
  },
  logo: {
    width: 150, // from web example (h-28 w-28 is approx 112px, let's make it a bit larger)
    height: 150,
    // marginBottom: 16, // Spacing between logo and title if they were in the same animated block
  },
  title: {
    // Matches framer-motion's h1
    fontFamily: TYPOGRAPHY.heading.fontFamily, // Your theme's serif/bold font
    fontSize: 32, // Equivalent to text-4xl
    fontWeight: 'bold',
    marginTop: 24, // Spacing from logo
    textAlign: 'center',
  },
  bottomContainer: {
    // Matches framer-motion's second animated div
    position: 'absolute',
    bottom: 60, // Adjust as needed (web example uses bottom-10)
    alignItems: 'center',
    width: '100%',
  },
  pulseBar: {
    width: 60, // from web example (w-10 is approx 40px, let's make it a bit wider)
    height: 4, // from web example (h-1)
    borderRadius: 2, // rounded-full
    marginBottom: 16, // from web example (mt-4 for text below)
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 15, // text-sm
    opacity: 0.8,
  },
  loader: {
    marginTop: 24, // Space above the loader
  },
});
