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
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useColorScheme } from 'react-native';

export default function SplashScreenComponent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation shared values
  const mainContentOpacity = useSharedValue(0);
  const mainContentScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const bottomContentOpacity = useSharedValue(0);
  const pulseBarScale = useSharedValue(1);

  useEffect(() => {
    // FIXED: Better animation sequence
    // Main content animation
    mainContentOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    mainContentScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    // Title animation (delayed)
    titleOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );
    titleTranslateY.value = withDelay(
      300,
      withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );

    // Bottom content animation (further delayed)
    bottomContentOpacity.value = withDelay(
      1000,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    // FIXED: Better pulsing animation
    pulseBarScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  // Animated styles
  const animatedMainContentStyle = useAnimatedStyle(() => ({
    opacity: mainContentOpacity.value,
    transform: [{ scale: mainContentScale.value }],
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const animatedBottomContentStyle = useAnimatedStyle(() => ({
    opacity: bottomContentOpacity.value,
  }));

  const animatedPulseBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: pulseBarScale.value }],
  }));

  // FIXED: Better theme-aware colors and assets
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const primaryTextColor = isDark ? COLORS.textLight : COLORS.textDark;
  const secondaryTextColor = isDark
    ? COLORS.textSecondaryDark || COLORS.gray
    : COLORS.gray;
  const pulseBarColor = COLORS.primary;

  // FIXED: Better logo selection logic
  const logoSource = isDark
    ? require('@/assets/images/dark-logo-sqaure.png')
    : require('@/assets/images/light-logo-sqaure.png');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.logoContainer, animatedMainContentStyle]}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.Text
        style={[styles.title, { color: primaryTextColor }, animatedTitleStyle]}
      >
        THE CLIFF NEWS
      </Animated.Text>

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  pulseBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 15,
    opacity: 0.8,
  },
  loader: {
    marginTop: 24,
  },
});
