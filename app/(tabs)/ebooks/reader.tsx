import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Share,
  BackHandler,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Home,
  Share2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Sun,
  Moon,
  RotateCcw,
  Bookmark,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react-native';
import { getBookById, EBook } from '@/utils/ebooksdata';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ReaderSettings {
  fontSize: number;
  nightMode: boolean;
  pageTransition: 'smooth' | 'instant';
}

const PDFReaderScreen = () => {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<EBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [pdfSource, setPdfSource] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    fontSize: 16,
    nightMode: false,
    pageTransition: 'smooth',
  });

  const { isDarkMode, colors, toggleTheme } = useTheme();
  const pdfRef = useRef<any>(null);
  const hideControlsTimer = useRef<number>(0);

  // Handle hardware back button on Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleClose();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription?.remove();
    }, [])
  );

  useEffect(() => {
    console.log('PDFReaderScreen mounted with bookId:', bookId);
    if (bookId) {
      const foundBook = getBookById(bookId);
      if (foundBook) {
        console.log('Book found:', foundBook.title);
        setBook(foundBook);
        loadPdfAsset(foundBook);
        loadReaderData();
      } else {
        console.error('Book not found for ID:', bookId);
        Alert.alert('Error', 'Book not found', [
          { text: 'OK', onPress: () => handleClose() },
        ]);
      }
    }
  }, [bookId]);

  const loadPdfAsset = async (book: EBook) => {
    try {
      setIsLoading(true);
      setHasError(false);
      console.log('Loading PDF asset for book:', book.title);

      // Get the asset
      const asset = Asset.fromModule(book.pdfPath);
      await asset.downloadAsync();
      console.log('Asset downloaded successfully');

      // For react-native-pdf, we can use the asset directly
      if (asset.localUri) {
        console.log('Setting PDF source:', asset.localUri);
        setPdfSource({ uri: asset.localUri, cache: true });
      } else if (asset.uri) {
        console.log('Setting PDF source from uri:', asset.uri);
        setPdfSource({ uri: asset.uri, cache: true });
      } else {
        // Fallback: try to use the module directly
        console.log('Using module directly as source');
        setPdfSource(book.pdfPath);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      setHasError(true);
      setIsLoading(false);
      Alert.alert(
        'Error Loading PDF',
        'Could not load the PDF file. Please try again.',
        [
          { text: 'Retry', onPress: () => loadPdfAsset(book) },
          { text: 'Close', onPress: handleClose },
        ]
      );
    }
  };

  const loadReaderData = async () => {
    try {
      // Load saved page
      const savedPage = await AsyncStorage.getItem(`book_${bookId}_page`);
      if (savedPage) setCurrentPage(parseInt(savedPage));

      // Load bookmarks
      const savedBookmarks = await AsyncStorage.getItem(
        `book_${bookId}_bookmarks`
      );
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      // Load reader settings
      const savedSettings = await AsyncStorage.getItem('reader_settings');
      if (savedSettings) {
        setReaderSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading reader data:', error);
    }
  };

  const saveReaderData = async () => {
    try {
      await AsyncStorage.setItem(`book_${bookId}_page`, currentPage.toString());
      await AsyncStorage.setItem(
        `book_${bookId}_bookmarks`,
        JSON.stringify(bookmarks)
      );
      await AsyncStorage.setItem(
        'reader_settings',
        JSON.stringify(readerSettings)
      );
    } catch (error) {
      console.error('Error saving reader data:', error);
    }
  };

  const handleClose = () => {
    saveReaderData();
    router.replace('/(tabs)/ebooks');
  };

  const handleHome = () => {
    saveReaderData();
    router.replace('/(tabs)');
  };

  const handleShare = async () => {
    if (!book) return;

    try {
      await Share.share({
        message: `Reading "${book.title}" by ${book.author} on The Cliff News app`,
        title: book.title,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      autoHideControls();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const autoHideControls = () => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.2, 2.5);
    setScale(newScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.7);
    setScale(newScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && pdfRef.current) {
      pdfRef.current.setPage(page);
      setCurrentPage(page);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const toggleBookmark = () => {
    const newBookmarks = bookmarks.includes(currentPage)
      ? bookmarks.filter((page) => page !== currentPage)
      : [...bookmarks, currentPage].sort((a, b) => a - b);

    setBookmarks(newBookmarks);
    Haptics.notificationAsync(
      bookmarks.includes(currentPage)
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
  };

  const handleReload = () => {
    if (book) {
      setIsLoading(true);
      setHasError(false);
      loadPdfAsset(book);
    }
  };

  const isBookmarked = bookmarks.includes(currentPage);

  // Animated styles for controls
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showControls ? 1 : 0, { duration: 300 }),
    transform: [
      {
        translateY: withTiming(showControls ? 0 : -100, { duration: 300 }),
      },
    ],
  }));

  const animatedBottomStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showControls ? 1 : 0, { duration: 300 }),
    transform: [
      {
        translateY: withTiming(showControls ? 0 : 100, { duration: 300 }),
      },
    ],
  }));

  // Loading screen
  if (!book || !pdfSource) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />

        {/* Header with close button */}
        <SafeAreaView edges={['top']}>
          <View
            style={[styles.loadingHeader, { backgroundColor: colors.primary }]}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={styles.loadingCloseButton}
            >
              <ArrowLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={[styles.loadingHeaderTitle, { color: colors.white }]}>
              {book?.title || 'Loading...'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <View style={styles.loadingContainer}>
          <FileText size={64} color={colors.primary} />
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            {!book
              ? 'Loading book...'
              : hasError
              ? 'Error loading PDF'
              : 'Preparing PDF...'}
          </Text>
          <Text
            style={[styles.loadingSubtext, { color: colors.textSecondary }]}
          >
            {hasError
              ? 'Please check your connection'
              : 'This may take a moment'}
          </Text>

          {hasError && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleReload}
            >
              <RefreshCw size={20} color={colors.white} />
              <Text style={[styles.retryButtonText, { color: colors.white }]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={
          showControls
            ? 'light-content'
            : isDarkMode
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={showControls ? colors.primary : colors.background}
      />

      {/* PDF Viewer */}
      <TouchableOpacity
        style={styles.pdfContainer}
        onPress={toggleControls}
        activeOpacity={1}
      >
        <Pdf
          ref={pdfRef}
          source={pdfSource}
          style={styles.pdf}
          scale={scale}
          minScale={0.5}
          maxScale={3.0}
          page={currentPage}
          horizontal={false}
          enablePaging={true}
          enableRTL={false}
          enableAnnotationRendering={false}
          trustAllCerts={false}
          onLoadComplete={(numberOfPages, path) => {
            console.log(`PDF loaded: ${numberOfPages} pages`);
            setTotalPages(numberOfPages);
            setIsLoading(false);
            // Navigate to saved page if available
            if (currentPage > 1 && currentPage <= numberOfPages) {
              setTimeout(() => {
                pdfRef.current?.setPage(currentPage);
              }, 100);
            }
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Page changed: ${page}/${numberOfPages}`);
            setCurrentPage(page);
          }}
          onError={(error) => {
            console.error('PDF Error:', error);
            setHasError(true);
            setIsLoading(false);
            Alert.alert(
              'Error Loading PDF',
              'Could not display the PDF file. Please try again.',
              [
                { text: 'Retry', onPress: handleReload },
                { text: 'Close', onPress: handleClose },
              ]
            );
          }}
          onPressLink={(uri) => {
            console.log(`Link pressed: ${uri}`);
          }}
          spacing={10}
          fitPolicy={0} // 0 = width, 1 = height, 2 = both
          // activityIndicator={
          //   <ActivityIndicator size="large" color={colors.primary} />
          // }
          // activityIndicatorProps={{
          //   color: colors.primary,
          //   progressTintColor: colors.primary,
          // }}
        />
      </TouchableOpacity>

      {/* Top Controls */}
      {showControls && (
        <Animated.View
          style={[
            styles.topControls,
            { backgroundColor: colors.primary },
            animatedControlsStyle,
          ]}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.topControlsContent}>
              <View style={styles.topLeft}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.controlButton}
                >
                  <ArrowLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleHome}
                  style={styles.controlButton}
                >
                  <Home size={22} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.topCenter}>
                <Text
                  style={[styles.bookTitle, { color: colors.white }]}
                  numberOfLines={1}
                >
                  {book.title}
                </Text>
                <Text
                  style={[styles.bookAuthor, { color: colors.white }]}
                  numberOfLines={1}
                >
                  by {book.author}
                </Text>
              </View>

              <View style={styles.topRight}>
                <TouchableOpacity
                  onPress={toggleBookmark}
                  style={[
                    styles.controlButton,
                    isBookmarked && {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  ]}
                >
                  <Bookmark
                    size={20}
                    color={colors.white}
                    fill={isBookmarked ? colors.white : 'transparent'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.controlButton}
                >
                  <Share2 size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSettings(true)}
                  style={styles.controlButton}
                >
                  <MoreVertical size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Bottom Controls */}
      {showControls && (
        <Animated.View
          style={[
            styles.bottomControls,
            { backgroundColor: colors.primary },
            animatedBottomStyle,
          ]}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.bottomControlsContent}>
              {/* Page Navigation */}
              <View style={styles.pageNavigation}>
                <TouchableOpacity
                  onPress={previousPage}
                  style={[
                    styles.navButton,
                    { opacity: currentPage > 1 ? 1 : 0.5 },
                  ]}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>

                <View style={styles.pageInfo}>
                  <Text style={[styles.pageText, { color: colors.white }]}>
                    {currentPage} / {totalPages || '...'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={nextPage}
                  style={[
                    styles.navButton,
                    { opacity: currentPage < totalPages ? 1 : 0.5 },
                  ]}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Zoom Controls */}
              <View style={styles.zoomControls}>
                <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
                  <ZoomOut size={20} color={colors.white} />
                </TouchableOpacity>

                <Text style={[styles.zoomText, { color: colors.white }]}>
                  {Math.round(scale * 100)}%
                </Text>

                <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
                  <ZoomIn size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View
          style={[styles.settingsModal, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.settingsHeader,
              { borderBottomColor: colors.textSecondary },
            ]}
          >
            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>
              Reading Settings
            </Text>
            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              style={styles.closeButton}
            >
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent}>
            {/* Theme Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                {isDarkMode ? (
                  <Moon size={24} color={colors.textPrimary} />
                ) : (
                  <Sun size={24} color={colors.textPrimary} />
                )}
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[styles.settingLabel, { color: colors.textPrimary }]}
                  >
                    Dark Mode
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Switch between light and dark themes
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: isDarkMode
                      ? colors.primary
                      : colors.lightGray,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleIndicator,
                    {
                      backgroundColor: colors.white,
                      transform: [{ translateX: isDarkMode ? 20 : 2 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Bookmark size={24} color={colors.textPrimary} />
                    <View style={styles.settingTextContainer}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Bookmarks ({bookmarks.length})
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Your saved pages
                      </Text>
                    </View>
                  </View>
                </View>

                {bookmarks.map((bookmark, index) => (
                  <TouchableOpacity
                    key={bookmark}
                    style={[
                      styles.bookmarkItem,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => {
                      goToPage(bookmark);
                      setShowSettings(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.bookmarkText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Page {bookmark}
                    </Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Reset Zoom */}
            <TouchableOpacity
              style={[styles.settingItem, styles.actionItem]}
              onPress={() => {
                setScale(1.0);
              }}
            >
              <View style={styles.settingInfo}>
                <RotateCcw size={24} color={colors.textPrimary} />
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[styles.settingLabel, { color: colors.textPrimary }]}
                  >
                    Reset Zoom
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Return to default zoom level
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Book Information */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <FileText size={24} color={colors.textPrimary} />
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[styles.settingLabel, { color: colors.textPrimary }]}
                  >
                    Book Information
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {book.description}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary, marginTop: 4 },
                    ]}
                  >
                    Category:{' '}
                    {book.category === 'religious'
                      ? 'Religious & Devotional'
                      : 'Novels & Stories'}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Pages: {totalPages || '...'} • Progress:{' '}
                    {totalPages
                      ? Math.round((currentPage / totalPages) * 100)
                      : 0}
                    %
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingOverlayText, { color: colors.primary }]}>
            Loading PDF...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  loadingCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingHeaderTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  loadingText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  topControlsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCenter: {
    flex: 2,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookAuthor: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bottomControlsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  pageText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },

  // Settings Modal Styles
  settingsModal: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingsTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionItem: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    marginLeft: 40,
    borderRadius: 8,
  },
  bookmarkText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
  },
});

export default PDFReaderScreen;
