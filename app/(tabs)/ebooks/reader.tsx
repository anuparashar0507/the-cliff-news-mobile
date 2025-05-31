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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  ArrowLeft,
  Home,
  ExternalLink,
  Download,
  AlertTriangle,
} from 'lucide-react-native';
import { getBookById, EBook } from '@/utils/ebooksdata';
import Constants from 'expo-constants';

// FIXED: Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import react-native-pdf only in development builds
let Pdf: any = null;

if (!isExpoGo) {
  try {
    Pdf = require('react-native-pdf').default;
  } catch (error: any) {
    console.log('react-native-pdf not available:', error.message);
  }
}

const { width, height } = Dimensions.get('window');

const PDFReaderScreen = () => {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<EBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (bookId) {
      const foundBook = getBookById(bookId);
      if (foundBook) {
        setBook(foundBook);
        setIsLoading(false);
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
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.push('/(tabs)');
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

  const handleExternalOpen = async () => {
    if (!book) return;

    try {
      // For Expo Go, we'll need to handle PDFs differently
      // This is a placeholder - you might want to open in browser or external app
      Alert.alert(
        'Open PDF',
        'This will open the PDF in an external app or browser.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => {
              // In a real implementation, you'd convert the require() path to a web URL
              console.log('Would open PDF externally:', book.pdfPath);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error opening PDF externally:', error);
    }
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

  // If we're in Expo Go and don't have the PDF library, show a fallback UI
  if (isExpoGo || !Pdf) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
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
              by {book.author}
            </Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Fallback Content */}
        <View style={styles.fallbackContainer}>
          <AlertTriangle size={80} color={COLORS.warning} />
          <Text style={styles.fallbackTitle}>Development Mode</Text>
          <Text style={styles.fallbackMessage}>
            PDF reading is not available in Expo Go. To read PDFs, you need to:
            {'\n\n'}
            1. Create a development build with `expo run:android` or `expo
            run:ios`
            {'\n'}
            2. Or install the production app from the app store
            {'\n\n'}
            For now, you can try opening the PDF externally.
          </Text>

          <TouchableOpacity
            style={styles.fallbackButton}
            onPress={handleExternalOpen}
          >
            <ExternalLink size={20} color={COLORS.white} />
            <Text style={styles.fallbackButtonText}>Open Externally</Text>
          </TouchableOpacity>

          <View style={styles.bookInfo}>
            <Text style={styles.bookInfoTitle}>Book Information</Text>
            <Text style={styles.bookInfoText}>Title: {book.title}</Text>
            <Text style={styles.bookInfoText}>Author: {book.author}</Text>
            <Text style={styles.bookInfoText}>Language: {book.language}</Text>
            <Text style={styles.bookInfoText}>Category: {book.category}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Regular PDF reader for development builds
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

        <View style={styles.headerRight} />
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <Pdf
          source={
            typeof book.pdfPath === 'string'
              ? { uri: book.pdfPath }
              : book.pdfPath
          }
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
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

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

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
    width: 80, // Balance the header
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
    height: height - 100,
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
  // Fallback styles for Expo Go
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 24,
    color: COLORS.secondary,
    marginTop: 20,
    marginBottom: 16,
  },
  fallbackMessage: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  fallbackButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  bookInfo: {
    backgroundColor: COLORS.lightGray,
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  bookInfoTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  bookInfoText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
});

// FIXED: Explicit default export
export default PDFReaderScreen;
