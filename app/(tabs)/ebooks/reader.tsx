import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Pdf from 'react-native-pdf';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  ArrowLeft,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Home,
  Bookmark,
  Share2,
} from 'lucide-react-native';
import { getBookById, EBook } from '@/utils/ebooksdata';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function PDFReaderScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<EBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (bookId) {
      const foundBook = getBookById(bookId);
      if (foundBook) {
        setBook(foundBook);
      } else {
        Alert.alert('Error', 'Book not found', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    }
  }, [bookId]);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setIsLoading(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.push('/(tabs)');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleShare = () => {
    if (book) {
      Alert.alert('Share', `Share "${book.title}" with others`);
    }
  };

  const handleError = (error: any) => {
    console.error('PDF Error:', error);
    setIsLoading(false);
    Alert.alert(
      'Error Loading PDF',
      'Failed to load the book. Please try again.',
      [
        { text: 'Retry', onPress: () => setIsLoading(true) },
        { text: 'Go Back', onPress: () => router.back() },
      ]
    );
  };

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading book...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHome} style={styles.headerButton}>
            <Home size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            by {book.author} • Page {currentPage} of {totalPages}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleBookmark}
            style={styles.headerButton}
          >
            <Bookmark
              size={20}
              color={isBookmarked ? COLORS.warning : COLORS.white}
              fill={isBookmarked ? COLORS.warning : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Share2 size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <Pdf
          source={book.pdfPath}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
          onLoadProgress={() => {}}
          style={styles.pdf}
          scale={scale}
          minScale={0.5}
          maxScale={3.0}
          enablePaging={true}
          spacing={10}
          fitPolicy={0}
          horizontal={false}
        />
      </View>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity onPress={handleZoomOut} style={styles.controlButton}>
          <ZoomOut size={20} color={COLORS.primary} />
          <Text style={styles.controlButtonText}>Zoom Out</Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageText}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity onPress={handleZoomIn} style={styles.controlButton}>
          <ZoomIn size={20} color={COLORS.primary} />
          <Text style={styles.controlButtonText}>Zoom In</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height - 200,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    minWidth: 80,
  },
  controlButtonText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  pageInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pageText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
});
