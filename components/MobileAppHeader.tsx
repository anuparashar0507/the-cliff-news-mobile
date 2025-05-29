import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  Share,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  Menu,
  Bell,
  RefreshCw,
  ArrowLeft,
  Home,
  X,
  BookOpen,
  Gamepad2,
  FileText,
  Newspaper,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface MobileAppHeaderProps {
  title?: string;
  showNotifications?: boolean;
  showRefresh?: boolean;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onNotificationPress?: () => void;
  onRefreshPress?: () => void;
  onBackPress?: () => void;
  onHomePress?: () => void;
  scrollY?: Animated.SharedValue<number>;
}

export default function MobileAppHeader({
  title = 'THE CLIFF NEWS',
  showNotifications = false, // Disabled as requested
  showRefresh = true,
  showBackButton = false,
  showHomeButton = false,
  onNotificationPress,
  onRefreshPress,
  onBackPress,
  onHomePress,
  scrollY,
}: MobileAppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Auto-detect navigation needs
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

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  const navigateTo = (route: string) => {
    setIsMenuVisible(false);
    router.push(route as any);
  };

  // Animated header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const opacity = interpolate(scrollY.value, [0, 100], [0.95, 1], 'clamp');

    return {
      opacity,
      elevation: interpolate(scrollY.value, [0, 50], [0, 8], 'clamp'),
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
            {/* Left Section - Logo and Navigation */}
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
                  onPress={handleMenuPress}
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

              {/* App Logo */}
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Center Section - Title */}
            <View style={styles.centerSection}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.headerSubtitle}>
                National Daily Bilingual Newspaper
              </Text>
            </View>

            {/* Right Section - Actions */}
            <View style={styles.rightSection}>
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
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Slide-out Menu */}
      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMenu}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={closeMenu} />
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.menuLogo}
                resizeMode="contain"
              />
              <Text style={styles.menuTitle}>THE CLIFF NEWS</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <X size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuContent}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/(tabs)')}
              >
                <Newspaper size={24} color={COLORS.primary} />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/(tabs)/epaper')}
              >
                <FileText size={24} color={COLORS.primary} />
                <Text style={styles.menuItemText}>E-Paper</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/(tabs)/ebooks')}
              >
                <BookOpen size={24} color={COLORS.primary} />
                <Text style={styles.menuItemText}>E-Books</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/(tabs)/games')}
              >
                <Gamepad2 size={24} color={COLORS.primary} />
                <Text style={styles.menuItemText}>Games</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  Share.share({
                    message:
                      'Check out The Cliff News - National Daily Bilingual Newspaper',
                    url: 'https://thecliffnews.in/',
                  });
                }}
              >
                <Text style={styles.menuItemText}>Share App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  // Add about/info functionality here
                }}
              >
                <Text style={styles.menuItemText}>About</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  logo: {
    width: 32,
    height: 32,
    marginLeft: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 9,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuBackdrop: {
    flex: 1,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuLogo: {
    width: 40,
    height: 40,
  },
  menuTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  menuContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  menuItemText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 8,
  },
});
