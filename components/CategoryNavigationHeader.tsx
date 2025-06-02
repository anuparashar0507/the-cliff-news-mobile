import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import type { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  title: string;
  url: string;
  isActive?: boolean;
}

interface CategoryNavigationHeaderProps {
  onCategoryPress: (url: string, title: string) => void;
  scrollY?: Animated.SharedValue<number>;
  activeCategory?: string;
}

// Define your categories based on your existing menu structure
const categories: CategoryItem[] = [
  { id: 'home', title: 'Top', url: 'https://thecliffnews.in/', isActive: true },
  {
    id: 'national',
    title: 'National',
    url: 'https://thecliffnews.in/index.php/category/national/',
  },
  {
    id: 'state',
    title: 'State',
    url: 'https://thecliffnews.in/index.php/category/state/',
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    url: 'https://thecliffnews.in/index.php/category/entertainment/',
  },
  {
    id: 'sports',
    title: 'Sports',
    url: 'https://thecliffnews.in/index.php/category/sports/',
  },
  {
    id: 'technology',
    title: 'Technology',
    url: 'https://thecliffnews.in/index.php/category/technology/',
  },
  {
    id: 'travel',
    title: 'Travel',
    url: 'https://thecliffnews.in/index.php/category/travel/',
  },
  {
    id: 'stock',
    title: 'Stock Market',
    url: 'https://thecliffnews.in/index.php/category/stock-market/',
  },
  {
    id: 'nit',
    title: 'NIT',
    url: 'https://thecliffnews.in/index.php/category/nit/',
  },
  {
    id: 'diy',
    title: 'DIY',
    url: 'https://thecliffnews.in/index.php/category/do-it-yourself/',
  },
];

export default function CategoryNavigationHeader({
  onCategoryPress,
  scrollY,
  activeCategory = 'home',
}: CategoryNavigationHeaderProps) {
  const { isDarkMode, colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(activeCategory);
  const [categoryWidths, setCategoryWidths] = useState<{
    [key: string]: number;
  }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const itemRefs = useRef<{ [key: string]: View | null }>({});

  // Calculate positions for auto-scroll
  const calculateScrollPosition = useCallback(
    (categoryId: string): number => {
      const categoryIndex = categories.findIndex(
        (cat) => cat.id === categoryId
      );
      if (categoryIndex === -1) return 0;

      let totalWidth = 16; // Initial padding

      // Sum widths of all categories before the target
      for (let i = 0; i < categoryIndex; i++) {
        const category = categories[i];
        const categoryWidth = categoryWidths[category.id] || 100; // fallback width
        totalWidth += categoryWidth + 8; // 8 = marginHorizontal * 2
      }

      // Add half of the target category width to center it
      const targetWidth = categoryWidths[categoryId] || 100;
      totalWidth += targetWidth / 2;

      // Center on screen
      const scrollToX = Math.max(0, totalWidth - width / 2);

      console.log('📍 Auto-scroll calculation:', {
        categoryId,
        categoryIndex,
        targetWidth,
        totalWidth,
        scrollToX,
        screenWidth: width,
      });

      return scrollToX;
    },
    [categoryWidths]
  );

  // Auto-scroll to active category
  const scrollToActiveCategory = useCallback(
    (categoryId: string, animated = true) => {
      if (!scrollViewRef.current || !isInitialized) {
        console.log('⏳ Scroll delayed - not initialized yet');
        return;
      }

      const scrollToX = calculateScrollPosition(categoryId);

      console.log(
        '🎯 Auto-scrolling to category:',
        categoryId,
        'position:',
        scrollToX
      );

      scrollViewRef.current.scrollTo({
        x: scrollToX,
        animated,
      });
    },
    [calculateScrollPosition, isInitialized]
  );

  // Update selected category when activeCategory prop changes
  useEffect(() => {
    console.log(
      '🏷️ CategoryNavigationHeader: activeCategory changed from',
      selectedCategory,
      'to',
      activeCategory
    );

    setSelectedCategory(activeCategory);

    // Auto-scroll to the new active category with a small delay to ensure layout is ready
    setTimeout(() => {
      scrollToActiveCategory(activeCategory, true);
    }, 100);
  }, [activeCategory, scrollToActiveCategory]);

  // Initialize auto-scroll after layout
  useEffect(() => {
    if (
      isInitialized &&
      Object.keys(categoryWidths).length >= categories.length
    ) {
      console.log('📐 All category widths measured, performing initial scroll');
      setTimeout(() => {
        scrollToActiveCategory(selectedCategory, false); // No animation for initial scroll
      }, 50);
    }
  }, [isInitialized, categoryWidths, selectedCategory, scrollToActiveCategory]);

  // Animation for scroll-based hiding
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -60],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 50, 100],
      [1, 0.7, 0],
      Extrapolate.CLAMP
    );

    // Also animate height to prevent white space
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [50, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
      height,
      overflow: 'hidden',
    };
  });

  const handleCategoryPress = (category: CategoryItem) => {
    console.log('👆 Category pressed:', category.id);
    setSelectedCategory(category.id);
    onCategoryPress(category.url, category.title);

    // Auto-scroll to center the selected item
    setTimeout(() => {
      scrollToActiveCategory(category.id, true);
    }, 50);
  };

  // Measure category item width
  const handleCategoryLayout = useCallback(
    (categoryId: string, width: number) => {
      setCategoryWidths((prev) => {
        const newWidths = { ...prev, [categoryId]: width };
        console.log(
          '📏 Category width measured:',
          categoryId,
          width,
          'Total measured:',
          Object.keys(newWidths).length
        );

        // Check if all categories are measured
        if (
          Object.keys(newWidths).length >= categories.length &&
          !isInitialized
        ) {
          console.log('✅ All categories measured, initializing auto-scroll');
          setIsInitialized(true);
        }

        return newWidths;
      });
    },
    [isInitialized]
  );

  const getCategoryItemStyle = (categoryId: string) => {
    const isSelected = selectedCategory === categoryId;
    return [
      styles.categoryItem,
      {
        backgroundColor: isSelected ? colors.primary : 'transparent',
        borderColor: isSelected ? colors.primary : colors.textSecondary + '40', // 40 for opacity
        borderWidth: isSelected ? 2 : 1,
      },
    ];
  };

  const getCategoryTextStyle = (categoryId: string) => {
    const isSelected = selectedCategory === categoryId;
    return {
      ...styles.categoryText,
      color: isSelected ? COLORS.white : colors.textPrimary,
      fontWeight: isSelected
        ? ('bold' as TextStyle['fontWeight'])
        : ('500' as TextStyle['fontWeight']),
    };
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.textSecondary + '30',
        },
        animatedStyle,
      ]}
    >
      {/* Active Category Indicator Line */}
      <View
        style={[styles.indicatorLine, { backgroundColor: colors.secondary }]}
      />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        bounces={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onContentSizeChange={() => {
          // Trigger auto-scroll when content size changes
          if (isInitialized) {
            setTimeout(() => {
              scrollToActiveCategory(selectedCategory, false);
            }, 50);
          }
        }}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category.id}
            ref={(ref) => {
              itemRefs.current[category.id] = ref;
            }}
            style={getCategoryItemStyle(category.id)}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.7}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              handleCategoryLayout(category.id, width);
            }}
          >
            <Text style={getCategoryTextStyle(category.id)}>
              {category.title}
            </Text>

            {/* Active category indicator dot */}
            {/* {selectedCategory === category.id && (
              <View
                style={[styles.activeDot, { backgroundColor: COLORS.white }]}
              />
            )} */}

            {/* Subtle pulse animation for active category */}
            {selectedCategory === category.id && (
              <Animated.View
                style={[
                  styles.activePulse,
                  { backgroundColor: colors.primary + '20' },
                ]}
              />
            )}
          </TouchableOpacity>
        ))}

        {/* Add some padding at the end for better scrolling */}
        <View style={{ width: 20 }} />
      </ScrollView>

      {/* Enhanced gradient fade effects */}
      <View
        style={[
          styles.fadeLeft,
          {
            backgroundColor: `linear-gradient(to right, ${colors.surface}, transparent)`,
          },
        ]}
      />
      <View
        style={[
          styles.fadeRight,
          {
            backgroundColor: `linear-gradient(to left, ${colors.surface}, transparent)`,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderBottomWidth: 1,
    position: 'relative',
    zIndex: 999,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  indicatorLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    minWidth: width, // Ensure full width scrolling
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    position: 'relative',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    textAlign: 'center',
    flexShrink: 1,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
  },
  activePulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    zIndex: -1,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 2,
    pointerEvents: 'none',
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 2,
    pointerEvents: 'none',
  },
});

// Enhanced version with live news indicator
export function CategoryNavigationHeaderWithLive({
  onCategoryPress,
  scrollY,
  activeCategory = 'home',
  hasLiveNews = false,
}: CategoryNavigationHeaderProps & { hasLiveNews?: boolean }) {
  const { isDarkMode, colors } = useTheme();

  // Animation for live news indicator
  const liveIndicatorOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (hasLiveNews) {
      // Pulsing animation for live indicator
      liveIndicatorOpacity.value = withTiming(0.5, { duration: 1000 });
      const interval = setInterval(() => {
        liveIndicatorOpacity.value = withTiming(
          liveIndicatorOpacity.value === 1 ? 0.5 : 1,
          { duration: 1000 }
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [hasLiveNews]);

  const animatedLiveStyle = useAnimatedStyle(() => ({
    opacity: liveIndicatorOpacity.value,
  }));

  return (
    <View>
      <CategoryNavigationHeader
        onCategoryPress={onCategoryPress}
        scrollY={scrollY}
        activeCategory={activeCategory}
      />

      {/* Live News Indicator */}
      {hasLiveNews && (
        <Animated.View
          style={[
            liveStyles.liveIndicator,
            { backgroundColor: colors.error },
            animatedLiveStyle,
          ]}
        >
          <View
            style={[liveStyles.liveDot, { backgroundColor: COLORS.white }]}
          />
          <Text style={[liveStyles.liveText, { color: COLORS.white }]}>
            LIVE
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// Additional styles for live indicator
const liveStyles = StyleSheet.create({
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
