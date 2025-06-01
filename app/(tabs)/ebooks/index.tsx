import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  BookOpen,
  Heart,
  Book,
  Download,
  User,
  FileText,
} from 'lucide-react-native';
import { ebooksData, getBooksByCategory, EBook } from '@/utils/ebooksdata';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;
const AnimatedCard = ({
  book,
  index,
  onPress,
}: {
  book: EBook;
  index: number;
  onPress: () => void;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const { isDarkMode, colors } = useTheme();

  const bookAuthorColor = isDarkMode ? colors.textLight : COLORS.secondary;

  useEffect(() => {
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      index * 100,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.bookCard, animatedStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.thumbnailContainer}>
          <Image source={book.thumbnail} style={styles.thumbnail} />
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>
              {book.language === 'hindi'
                ? 'हिं'
                : book.language === 'english'
                ? 'EN'
                : 'Both'}
            </Text>
          </View>
        </View>
        <View style={styles.bookInfo}>
          <Text
            style={[styles.bookTitle, { color: bookAuthorColor }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <View style={styles.authorRow}>
            <User size={12} color={COLORS.gray} />
            <Text
              style={[styles.bookAuthor, { color: bookAuthorColor }]}
              numberOfLines={1}
            >
              {book.author}
            </Text>
          </View>
          {/* <View style={styles.bookMeta}>
            <View style={styles.metaItem}>
              <FileText size={12} color={COLORS.accent} />
              <Text style={styles.metaText}>{book.pages}p</Text>
            </View>
            <View style={styles.metaItem}>
              <Download size={12} color={COLORS.accent} />
              <Text style={styles.metaText}>{book.fileSize}</Text>
            </View>
          </View> */}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function EBooksScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    'religious' | 'novels' | null
  >(null);
  const [books, setBooks] = useState<EBook[]>([]);
  const { isDarkMode, colors } = useTheme();
  useEffect(() => {
    if (selectedCategory) {
      setBooks(getBooksByCategory(selectedCategory));
    } else {
      setBooks([]);
    }
  }, [selectedCategory]);

  const handleCategorySelect = (category: 'religious' | 'novels') => {
    setSelectedCategory(category);
  };

  const handleBookPress = (book: EBook) => {
    // FIXED: Correct routing path
    router.push({
      pathname: '/(tabs)/ebooks/reader' as any,
      params: { bookId: book.id },
    });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  // Category Selection Screen
  if (!selectedCategory) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <View style={styles.header}>
          <BookOpen size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Digital Library
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Choose your reading category
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity
            style={[
              styles.categoryCard,
              styles.religiousCard,
              { backgroundColor: colors.accent },
            ]}
            onPress={() => handleCategorySelect('religious')}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIcon}>
              <Heart size={48} color={COLORS.white} />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Religious & Devotional</Text>
              <Text style={styles.categoryDescription}>
                Sacred texts, spiritual books, and devotional literature
              </Text>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryCount}>
                  {getBooksByCategory('religious').length} Books Available
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryCard,
              styles.novelsCard,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => handleCategorySelect('novels')}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIcon}>
              <Book size={48} color={COLORS.white} />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Novels & Stories</Text>
              <Text style={styles.categoryDescription}>
                Classic literature, modern novels, and short story collections
              </Text>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryCount}>
                  {getBooksByCategory('novels').length} Books Available
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Books List Screen
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View
        style={[
          styles.booksHeader,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.textSecondary,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBackToCategories}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Categories
          </Text>
        </TouchableOpacity>
        <Text
          style={[styles.categoryHeaderTitle, { color: colors.textPrimary }]}
        >
          {selectedCategory === 'religious'
            ? 'Religious & Devotional'
            : 'Novels & Stories'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.booksGrid}
        showsVerticalScrollIndicator={false}
      >
        {books.map((book, index) => (
          <AnimatedCard
            key={book.id}
            book={book}
            index={index}
            onPress={() => handleBookPress(book)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same as before...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 28,
    marginTop: 12,
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    marginTop: 8,
  },
  categoriesContainer: {
    padding: 20,
    gap: 20,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  religiousCard: {
    backgroundColor: COLORS.accent,
  },
  novelsCard: {
    backgroundColor: COLORS.primary,
  },
  categoryIcon: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    color: COLORS.white,
    marginBottom: 8,
  },
  categoryDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 16,
  },
  categoryStats: {
    marginTop: 'auto',
  },
  categoryCount: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  booksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.primary,
  },
  categoryHeaderTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    color: COLORS.secondary,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 20,
    justifyContent: 'space-between',
  },
  bookCard: {
    width: cardWidth,
    // backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  thumbnailContainer: {
    position: 'relative',
    height: cardWidth * 1.2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  languageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 10,
    // color: COLORS.white,
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  bookAuthor: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 13,
    color: COLORS.gray,
    flex: 1,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.accent,
  },
});
