import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Sun,
  Moon,
  Bookmark,
  X,
  FileText,
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

const PDFReaderScreen = () => {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<EBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const { isDarkMode, colors, toggleTheme } = useTheme();
  const pdfRef = useRef<Pdf>(null);
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
    if (bookId) {
      const foundBook = getBookById(bookId);
      if (foundBook) {
        setBook(foundBook);
        loadPdfAsset(foundBook);
        loadReaderData();
      } else {
        Alert.alert('Error', 'Book not found', [
          { text: 'OK', onPress: () => handleClose() },
        ]);
      }
    }
  }, [bookId]);

  useEffect(() => {
    // Auto-hide controls after 4 seconds
    if (showControls) {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [showControls]);

  const loadPdfAsset = async (book: EBook) => {
    try {
      setIsLoading(true);
      console.log('Loading PDF asset for book:', book.title);

      // Get the asset and copy it to a readable location
      const asset = Asset.fromModule(book.pdfPath);
      await asset.downloadAsync();
      console.log('Asset downloaded:', asset.localUri);

      // Copy to document directory for react-native-pdf
      const localUri = `${FileSystem.documentDirectory}${book.id}.pdf`;
      console.log('Target local URI:', localUri);

      // Check if already copied
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        console.log('Copying file to local directory...');
        await FileSystem.copyAsync({
          from: asset.localUri || asset.uri,
          to: localUri,
        });
      }

      console.log('PDF file ready at:', localUri);
      setPdfUri(localUri);
    } catch (error) {
      console.error('Error loading PDF:', error);
      Alert.alert(
        'Error Loading PDF',
        'Could not load the PDF file. Please try again.',
        [{ text: 'OK', onPress: handleClose }]
      );
    }
  };

  const loadReaderData = async () => {
    try {
      // Load saved page
      const savedPage = await AsyncStorage.getItem(`book_${bookId}_page`);
      if (savedPage) {
        setCurrentPage(parseInt(savedPage));
      }

      // Load bookmarks
      const savedBookmarks = await AsyncStorage.getItem(
        `book_${bookId}_bookmarks`
      );
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error('Error loading reader data:', error);
    }
  };

  const saveReaderData = async () => {
    try {
      await AsyncStorage.multiSet([
        [`book_${bookId}_page`, currentPage.toString()],
        [`book_${bookId}_bookmarks`, JSON.stringify(bookmarks)],
      ]);
      console.log('Reader data saved successfully');
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
        message: `Reading "${book.title}" by ${book.author} on The Cliff News app. Currently on page ${currentPage} of ${totalPages}.`,
        title: book.title,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && pdfRef.current) {
      setCurrentPage(page);
      pdfRef.current.setPage(page);
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

  const handlePageChanged = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    if (totalPages === 0) {
      setTotalPages(numberOfPages);
    }
  };

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log('PDF loaded successfully:', numberOfPages, 'pages');
    setTotalPages(numberOfPages);
    setIsLoading(false);

    // Go to saved page
    if (currentPage > 1 && pdfRef.current) {
      setTimeout(() => {
        pdfRef.current?.setPage(currentPage);
      }, 500);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleError = (error: any) => {
    console.error('PDF Error:', error);
    setIsLoading(false);
    Alert.alert(
      'Error Loading PDF',
      'There was an error loading the PDF file. Please try again.',
      [{ text: 'OK', onPress: handleClose }]
    );
  };

  const getProgressPercentage = () => {
    if (totalPages === 0) return 0;
    return Math.round((currentPage / totalPages) * 100);
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

  const progressBarStyle = useAnimatedStyle(() => ({
    width: withTiming(`${getProgressPercentage()}%`, { duration: 500 }),
  }));

  if (!book || isLoading || !pdfUri) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <FileText size={64} color={colors.primary} />
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            {!book ? 'Loading book...' : 'Preparing PDF...'}
          </Text>
          <Text
            style={[styles.loadingSubtext, { color: colors.textSecondary }]}
          >
            This may take a moment for large files
          </Text>
          {book && (
            <Text style={[styles.bookLoadingTitle, { color: colors.primary }]}>
              {book.title}
            </Text>
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
      <View style={styles.pdfContainer}>
        <TouchableOpacity
          style={styles.pdfTouchable}
          onPress={toggleControls}
          activeOpacity={1}
        >
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUri, cache: true }}
            style={styles.pdf}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            page={currentPage}
            minScale={0.5}
            maxScale={3.0}
            horizontal={true}
            spacing={10}
            password=""
            enablePaging={true}
            enableRTL={false}
            enableAnnotationRendering={true}
            enableDoubleTapZoom={true}
            trustAllCerts={false}
            singlePage={false}
            // fitWidth={true}
            // activityIndicatorProps={{
            //   color: colors.primary,
            //   progressTintColor: colors.primary,
            // }}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View
        style={[styles.progressContainer, { backgroundColor: colors.surface }]}
      >
        <View
          style={[styles.progressBar, { backgroundColor: colors.lightGray }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary },
              progressBarStyle,
            ]}
          />
        </View>
      </View>

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
                <Text style={[styles.progressText, { color: colors.white }]}>
                  {getProgressPercentage()}% complete
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
                    {currentPage} of {totalPages}
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
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Simple Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.textSecondary },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Settings
            </Text>
            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              style={styles.closeButton}
            >
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
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
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.textPrimary }]}
                  >
                    Bookmarks ({bookmarks.length})
                  </Text>
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
                    <Bookmark size={16} color={colors.primary} />
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

            {/* Book Info */}
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                About This Book
              </Text>
            </View>
            <View
              style={[
                styles.bookInfoContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[styles.bookInfoTitle, { color: colors.textPrimary }]}
              >
                {book.title}
              </Text>
              <Text
                style={[styles.bookInfoAuthor, { color: colors.textSecondary }]}
              >
                by {book.author}
              </Text>
              <Text
                style={[
                  styles.bookInfoDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {book.description}
              </Text>
              <View style={styles.bookInfoMeta}>
                <Text
                  style={[
                    styles.bookInfoMetaText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Category:{' '}
                  {book.category === 'religious'
                    ? 'Religious & Devotional'
                    : 'Novels & Stories'}
                </Text>
                <Text
                  style={[
                    styles.bookInfoMetaText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Language:{' '}
                  {book.language === 'hindi'
                    ? 'Hindi'
                    : book.language === 'english'
                    ? 'English'
                    : 'Both'}
                </Text>
                <Text
                  style={[
                    styles.bookInfoMetaText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Total Pages: {totalPages}
                </Text>
                <Text
                  style={[
                    styles.bookInfoMetaText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Progress: {getProgressPercentage()}%
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  bookLoadingTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pdfContainer: {
    flex: 1,
  },
  pdfTouchable: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
  },
  progressContainer: {
    height: 3,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  progressBar: {
    flex: 1,
    height: '100%',
  },
  progressFill: {
    height: '100%',
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
    minHeight: 70,
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
    marginHorizontal: 3,
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
  progressText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 11,
    opacity: 0.8,
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
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 40,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  pageText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Settings Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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

  // Section Styles
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Bookmark Styles
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  bookmarkText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },

  // Book Info Styles
  bookInfoContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  bookInfoTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookInfoAuthor: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    marginBottom: 8,
  },
  bookInfoDescription: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  bookInfoMeta: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  bookInfoMetaText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    marginBottom: 4,
  },
});

export default PDFReaderScreen;
