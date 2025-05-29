import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  Menu,
  Search,
  Bell,
  Share2,
  RefreshCw,
  ArrowLeft,
  Home,
  X,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface MobileAppHeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showShare?: boolean;
  showRefresh?: boolean;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  onRefreshPress?: () => void;
  onBackPress?: () => void;
  onHomePress?: () => void;
  scrollY?: Animated.SharedValue<number>;
  customActions?: React.ReactNode;
}

export default function MobileAppHeader({
  title = 'THE CLIFF NEWS',
  showSearch = true,
  showNotifications = true,
  showShare = true,
  showRefresh = true,
  showBackButton = false,
  showHomeButton = false,
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  onSharePress,
  onRefreshPress,
  onBackPress,
  onHomePress,
  scrollY,
  customActions,
}: MobileAppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Determine if we should show back/home buttons based on current route
  const isMainTab = [
    '/',
    '/(tabs)',
    '/(tabs)/epaper',
    '/(tabs)/ebooks',
    '/(tabs)/games',
  ].includes(pathname);
  const shouldShowBack = showBackButton || !isMainTab;
  const shouldShowHome = showHomeButton || !isMainTab;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      router.push('/(tabs)');
    }
  };

  const handleSearch = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      setIsSearchVisible(!isSearchVisible);
    }
  };

  const handleShare = async () => {
    if (onSharePress) {
      onSharePress();
    } else {
      try {
        await Share.share({
          message:
            'Check out The Cliff News - National Daily Bilingual Newspaper',
          url: 'https://thecliffnews.in/',
          title: 'The Cliff News',
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleNotifications = () => {
    if (onNotificationPress) {
      onNotificationPress();
    }
  };

  const handleRefresh = () => {
    if (onRefreshPress) {
      onRefreshPress();
    }
  };

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
    }
  };

  // Animated header that changes on scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const opacity = interpolate(scrollY.value, [0, 100], [0.95, 1], 'clamp');

    const elevation = interpolate(scrollY.value, [0, 50], [0, 8], 'clamp');

    return {
      opacity,
      elevation,
      shadowOpacity: interpolate(scrollY.value, [0, 50], [0, 0.3], 'clamp'),
    };
  });

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            {/* Left Section */}
            <View style={styles.leftSection}>
              {shouldShowBack ? (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleBack}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ArrowLeft size={24} color={COLORS.white} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleMenu}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Menu size={24} color={COLORS.white} />
                </TouchableOpacity>
              )}

              {shouldShowHome && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleHome}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Home size={22} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>

            {/* Center Section */}
            <View style={styles.centerSection}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.headerSubtitle}>
                National Daily Bilingual Newspaper
              </Text>
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              {customActions || (
                <>
                  {showSearch && (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleSearch}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Search size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  )}

                  {showNotifications && (
                    <TouchableOpacity
                      style={[styles.iconButton, styles.notificationButton]}
                      onPress={handleNotifications}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Bell size={20} color={COLORS.white} />
                      <View style={styles.notificationDot} />
                    </TouchableOpacity>
                  )}

                  {showRefresh && (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleRefresh}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <RefreshCw size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  )}

                  {showShare && (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleShare}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Share2 size={18} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1000,
  },
  safeArea: {
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 10,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
});
