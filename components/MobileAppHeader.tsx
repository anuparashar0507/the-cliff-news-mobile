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
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  Menu,
  RefreshCw,
  ArrowLeft,
  Home,
  X,
  BookOpen,
  Gamepad2,
  FileText,
  Newspaper,
  ChevronRight,
  ExternalLink,
  Info,
  Sun,
  Moon,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface MobileAppHeaderProps {
  title?: string;
  showRefresh?: boolean;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onRefreshPress?: () => void;
  onBackPress?: () => void;
  onHomePress?: () => void;
  scrollY?: Animated.SharedValue<number>;
  onThemeChange?: (isDark: boolean) => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  title: string;
  url?: string;
  description?: string;
  items?: MenuItem[];
}

const menuData: MenuSection[] = [
  {
    title: 'Main Navigation',
    items: [
      { title: 'Home', url: 'https://thecliffnews.in/' },
      { title: 'E-paper', url: 'https://thecliffnews.in/index.php/e-paper/' },
    ],
  },
  {
    title: 'News Categories',
    items: [
      {
        title: 'News',
        items: [
          {
            title: 'National',
            url: 'https://thecliffnews.in/index.php/category/national/',
          },
          {
            title: 'State',
            url: 'https://thecliffnews.in/index.php/category/state/',
          },
          {
            title: 'Entertainment',
            url: 'https://thecliffnews.in/index.php/category/entertainment/',
          },
          {
            title: 'Sports',
            url: 'https://thecliffnews.in/index.php/category/sports/',
          },
          {
            title: 'Technology',
            url: 'https://thecliffnews.in/index.php/category/technology/',
          },
          {
            title: 'Travel',
            url: 'https://thecliffnews.in/index.php/category/travel/',
          },
          {
            title: 'Stock Market',
            url: 'https://thecliffnews.in/index.php/category/stock-market/',
          },
        ],
      },
      {
        title: 'Highlights',
        url: 'https://thecliffnews.in/index.php/highlights/',
        items: [
          {
            title: 'Archive',
            url: 'https://thecliffnews.in/?post_type=r3d',
            description: 'Description.',
          },
        ],
      },
    ],
  },
  {
    title: 'Special Sections',
    items: [
      {
        title: 'NIT',
        url: 'https://thecliffnews.in/index.php/category/nit/',
        description: 'NOTICE INVITING TENDERS',
      },
      {
        title: 'Do It Yourself',
        url: 'https://thecliffnews.in/index.php/category/do-it-yourself/',
      },
      {
        title: 'Book Your Advertisement',
        url: 'https://thecliffnews.in/index.php/book-your-advertisement/',
      },
      { title: 'About Us', url: 'https://thecliffnews.in/index.php/about-us/' },
    ],
  },
];

export default function MobileAppHeader({
  title = 'THE CLIFF NEWS',
  showRefresh = true,
  showBackButton = false,
  showHomeButton = false,
  onRefreshPress,
  onBackPress,
  onHomePress,
  scrollY,
  onThemeChange,
}: MobileAppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

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
      // Safe navigation back
      if (router.canGoBack()) {
        router.back();
      } else {
        // If can't go back, go to home
        router.replace('/(tabs)');
      }
    }
  };

  const handleHome = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      // For PDF reader, replace to close it completely
      if (pathname.includes('/reader')) {
        router.replace('/(tabs)/ebooks');
      } else {
        router.push('/(tabs)');
      }
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
    setExpandedItems({});
  };

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemTitle]: !prev[itemTitle],
    }));
  };

  const navigateToUrl = (url?: string) => {
    if (!url) return;

    setIsMenuVisible(false);

    if (url === 'https://thecliffnews.in/') {
      router.push('/(tabs)');
    } else if (url.includes('e-paper')) {
      router.push('/(tabs)/epaper');
    } else {
      // Navigate to web URL in main WebView
      router.push({
        pathname: '/(tabs)',
        params: { urlToLoad: url },
      });
    }
  };

  const navigateTo = (route: string) => {
    setIsMenuVisible(false);
    router.push(route as any);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    onThemeChange?.(newTheme);
  };

  // Get theme-aware colors
  const headerBgColor = isDarkMode ? COLORS.surfaceDark : COLORS.primary;
  const textColor = isDarkMode ? COLORS.textLight : COLORS.white;
  const menuBgColor = isDarkMode ? COLORS.surfaceDark : COLORS.white;
  const menuTextColor = isDarkMode ? COLORS.textLight : COLORS.secondary;
  const menuItemBgColor = isDarkMode ? COLORS.backgroundDark : COLORS.lightGray;

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

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasSubItems = item.items && item.items.length > 0;
    const isExpanded = expandedItems[item.title];
    const indentStyle = { paddingLeft: 16 + level * 20 };

    return (
      <View key={item.title}>
        <TouchableOpacity
          style={[styles.menuItem, indentStyle]}
          onPress={() => {
            if (hasSubItems) {
              toggleExpanded(item.title);
            } else if (item.url) {
              navigateToUrl(item.url);
            }
          }}
        >
          <View style={styles.menuItemContent}>
            <View style={styles.menuItemTextContainer}>
              <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                {item.title}
              </Text>
              {item.description && (
                <Text
                  style={[
                    styles.menuItemDescription,
                    { color: menuTextColor, opacity: 0.7 },
                  ]}
                >
                  {item.description}
                </Text>
              )}
            </View>
            {hasSubItems && (
              <ChevronRight
                size={16}
                color={menuTextColor}
                style={{
                  transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                }}
              />
            )}
            {item.url && !hasSubItems && (
              <ExternalLink size={14} color={COLORS.primary} />
            )}
          </View>
        </TouchableOpacity>

        {hasSubItems && isExpanded && (
          <View
            style={[
              styles.subMenuContainer,
              { backgroundColor: menuItemBgColor },
            ]}
          >
            {item.items!.map((subItem) => renderMenuItem(subItem, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={headerBgColor}
        translucent={false}
      />
      <Animated.View
        style={[
          styles.headerContainer,
          { backgroundColor: headerBgColor },
          headerAnimatedStyle,
        ]}
      >
        <SafeAreaView
          edges={['top']}
          style={{ backgroundColor: headerBgColor }}
        >
          <View style={styles.header}>
            {/* Left Section - Logo and Title */}
            <View style={styles.leftSection}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text
                style={[styles.headerTitle, { color: textColor }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>

            {/* Right Section - Navigation and Menu */}
            <View style={styles.rightSection}>
              {shouldShowBack && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleBack}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ArrowLeft size={24} color={textColor} />
                </TouchableOpacity>
              )}

              {shouldShowHome && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleHome}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Home size={22} color={textColor} />
                </TouchableOpacity>
              )}

              {showRefresh && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleRefresh}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <RefreshCw size={20} color={textColor} />
                </TouchableOpacity>
              )}

              {/* Menu Button */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleMenuPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Menu size={24} color={textColor} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Side Menu - Slide from Right */}
      <Modal
        visible={isMenuVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={closeMenu} />
          <Animated.View
            style={[styles.sideMenuContainer, { backgroundColor: menuBgColor }]}
          >
            <View
              style={[
                styles.menuHeader,
                {
                  borderBottomColor: isDarkMode
                    ? COLORS.darkGray
                    : COLORS.lightGray,
                },
              ]}
            >
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.menuLogo}
                resizeMode="contain"
              />
              <Text style={[styles.menuTitle, { color: menuTextColor }]}>
                THE CLIFF NEWS
              </Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <X size={24} color={menuTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              {/* App Sections */}
              <View style={styles.appSections}>
                <Text style={[styles.sectionHeader, { color: menuTextColor }]}>
                  App Features
                </Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo('/(tabs)')}
                >
                  <Newspaper size={24} color={COLORS.primary} />
                  <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                    Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo('/(tabs)/epaper')}
                >
                  <FileText size={24} color={COLORS.primary} />
                  <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                    E-Paper
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo('/(tabs)/ebooks')}
                >
                  <BookOpen size={24} color={COLORS.primary} />
                  <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                    E-Books
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo('/(tabs)/games')}
                >
                  <Gamepad2 size={24} color={COLORS.primary} />
                  <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                    Games
                  </Text>
                </TouchableOpacity>

                {/* Theme Toggle */}
                <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                  {isDarkMode ? (
                    <Sun size={24} color={COLORS.primary} />
                  ) : (
                    <Moon size={24} color={COLORS.primary} />
                  )}
                  <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.menuDivider,
                  {
                    backgroundColor: isDarkMode
                      ? COLORS.darkGray
                      : COLORS.lightGray,
                  },
                ]}
              />

              {/* Website Menu Structure */}
              {menuData.map((section) => (
                <View key={section.title} style={styles.menuSection}>
                  <Text
                    style={[styles.sectionHeader, { color: menuTextColor }]}
                  >
                    {section.title}
                  </Text>
                  {section.items.map((item) => renderMenuItem(item))}
                </View>
              ))}

              <View
                style={[
                  styles.menuDivider,
                  {
                    backgroundColor: isDarkMode
                      ? COLORS.darkGray
                      : COLORS.lightGray,
                  },
                ]}
              />

              {/* App Actions */}
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
                <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                  Share App
                </Text>
              </TouchableOpacity>

              {/* Version Info */}
              <View style={styles.versionInfo}>
                <Text
                  style={[
                    styles.versionText,
                    { color: menuTextColor, opacity: 0.6 },
                  ]}
                >
                  The Cliff News v1.0.0
                </Text>
                <Text
                  style={[
                    styles.versionText,
                    { color: menuTextColor, opacity: 0.6 },
                  ]}
                >
                  National Daily Bilingual Newspaper
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 8,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Side Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  menuBackdrop: {
    flex: 1,
  },
  sideMenuContainer: {
    width: '85%',
    maxWidth: 350,
    height: '100%',
    shadowColor: COLORS.black,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
  },
  menuLogo: {
    width: 40,
    height: 40,
  },
  menuTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  menuContent: {
    flex: 1,
  },
  appSections: {
    padding: 16,
  },
  sectionHeader: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    marginLeft: 16,
  },
  menuItemDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    marginLeft: 16,
    marginTop: 2,
    fontStyle: 'italic',
  },
  subMenuContainer: {
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
  },
  versionInfo: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    textAlign: 'center',
  },
});
