// ===== app/(tabs)/ebooks/reader.tsx (EXPO MANAGED WORKFLOW VERSION) =====
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
import { WebView } from 'react-native-webview';
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
  const [totalPages, setTotalPages] = useState(100); // Default fallback
  const [scale, setScale] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    fontSize: 16,
    nightMode: false,
    pageTransition: 'smooth',
  });
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const controlsOpacity = useSharedValue(1);
  // const hideControlsTimer = useRef<NodeJS.Timeout>();
  const hideControlsTimer = { current: 0 as number };
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

  const loadPdfAsset = async (book: EBook) => {
    try {
      setIsLoading(true);

      // Get the asset and copy it to a readable location
      const asset = Asset.fromModule(book.pdfPath);
      await asset.downloadAsync();

      // Copy to local file system so it can be accessed by WebView
      const localUri = `${FileSystem.documentDirectory}${book.id}.pdf`;

      // Check if already copied
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        await FileSystem.copyAsync({
          from: asset.localUri || asset.uri,
          to: localUri,
        });
      }

      setPdfUri(localUri);
      console.log('PDF loaded successfully:', localUri);
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
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      autoHideControls();
    }
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
    sendMessageToWebView({ type: 'ZOOM', scale: newScale });
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.7);
    setScale(newScale);
    sendMessageToWebView({ type: 'ZOOM', scale: newScale });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      sendMessageToWebView({ type: 'GO_TO_PAGE', page });
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
  };

  const sendMessageToWebView = (message: any) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'PAGE_CHANGED':
          setCurrentPage(data.page);
          break;
        case 'TOTAL_PAGES':
          setTotalPages(data.totalPages);
          break;
        case 'PDF_READY':
          setIsLoading(false);
          // Go to saved page after PDF is ready
          if (currentPage > 1) {
            setTimeout(() => goToPage(currentPage), 500);
          }
          break;
        case 'PDF_ERROR':
          setIsLoading(false);
          Alert.alert('Error', 'Failed to load PDF content');
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Create HTML content for PDF viewing using PDF.js
  const createPDFViewerHTML = () => {
    if (!pdfUri || !book) return '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
    <title>${book.title}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background-color: ${isDarkMode ? '#1a1a1a' : '#f5f5f5'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: ${isDarkMode ? '#ffffff' : '#333333'};
            overflow-x: hidden;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
        }
        
        .pdf-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 10px;
            min-height: 100vh;
        }
        
        .page-container {
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
            overflow: hidden;
            background: white;
            display: none;
        }
        
        .page-container.active {
            display: block;
        }
        
        canvas {
            display: block;
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }
        
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: #FFA500;
        }
        
        .error {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 16px;
            color: #ff6b6b;
            text-align: center;
            padding: 20px;
        }
        
        .page-indicator {
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
        }
        
        .page-indicator.show {
            opacity: 1;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        📖 Loading "${book.title}"...
    </div>
    
    <div id="error" class="error" style="display: none;">
        <div>
            ❌ Could not load PDF<br>
            Please check your internet connection and try again.
        </div>
    </div>
    
    <div id="pdf-container" class="pdf-container" style="display: none;">
        <!-- PDF pages will be rendered here -->
    </div>
    
    <div id="page-indicator" class="page-indicator">
        Page 1 of 1
    </div>

    <script>
        let pdfDoc = null;
        let currentPage = 1;
        let totalPages = 0;
        let scale = ${scale};
        let renderedPages = {};
        
        // PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        async function loadPDF() {
            try {
                console.log('Loading PDF from: ${pdfUri}');
                
                const loadingTask = pdfjsLib.getDocument('${pdfUri}');
                pdfDoc = await loadingTask.promise;
                totalPages = pdfDoc.numPages;
                
                console.log('PDF loaded successfully. Total pages:', totalPages);
                
                // Create page containers
                const container = document.getElementById('pdf-container');
                for (let i = 1; i <= totalPages; i++) {
                    const pageDiv = document.createElement('div');
                    pageDiv.id = 'page-' + i;
                    pageDiv.className = 'page-container';
                    if (i === 1) pageDiv.classList.add('active');
                    container.appendChild(pageDiv);
                }
                
                // Render first page
                await renderPage(1);
                
                // Hide loading, show PDF
                document.getElementById('loading').style.display = 'none';
                document.getElementById('pdf-container').style.display = 'block';
                
                // Send ready message
                sendMessage({ type: 'PDF_READY' });
                sendMessage({ type: 'TOTAL_PAGES', totalPages: totalPages });
                updatePageIndicator();
                
            } catch (error) {
                console.error('Error loading PDF:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'flex';
                sendMessage({ type: 'PDF_ERROR', error: error.message });
            }
        }
        
        async function renderPage(pageNum) {
            if (renderedPages[pageNum]) return;
            
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                const pageContainer = document.getElementById('page-' + pageNum);
                pageContainer.innerHTML = '';
                pageContainer.appendChild(canvas);
                
                renderedPages[pageNum] = true;
                console.log('Rendered page:', pageNum);
                
            } catch (error) {
                console.error('Error rendering page ' + pageNum + ':', error);
            }
        }
        
        function showPage(pageNum) {
            if (pageNum < 1 || pageNum > totalPages) return;
            
            // Hide all pages
            document.querySelectorAll('.page-container').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show target page
            const targetPage = document.getElementById('page-' + pageNum);
            if (targetPage) {
                targetPage.classList.add('active');
                currentPage = pageNum;
                
                // Render page if not already rendered
                renderPage(pageNum);
                
                // Pre-render adjacent pages
                if (pageNum > 1) renderPage(pageNum - 1);
                if (pageNum < totalPages) renderPage(pageNum + 1);
                
                sendMessage({ type: 'PAGE_CHANGED', page: currentPage });
                updatePageIndicator();
                
                // Scroll to top
                window.scrollTo(0, 0);
            }
        }
        
        function updatePageIndicator() {
            const indicator = document.getElementById('page-indicator');
            indicator.textContent = \`Page \${currentPage} of \${totalPages}\`;
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
        
        async function reRenderAllPages() {
            renderedPages = {};
            for (let i = 1; i <= totalPages; i++) {
                const pageContainer = document.getElementById('page-' + i);
                if (pageContainer) {
                    pageContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Loading...</div>';
                }
            }
            await renderPage(currentPage);
            // Re-render adjacent pages
            if (currentPage > 1) await renderPage(currentPage - 1);
            if (currentPage < totalPages) await renderPage(currentPage + 1);
        }
        
        function sendMessage(data) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
        }
        
        // Listen for messages from React Native
        window.addEventListener('message', async (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'GO_TO_PAGE':
                        showPage(data.page);
                        break;
                    case 'ZOOM':
                        scale = data.scale;
                        await reRenderAllPages();
                        break;
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });
        
        // Touch handling for page navigation
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = Math.abs(touchStartY - touchEndY);
            
            // Only process horizontal swipes
            if (Math.abs(diffX) > 50 && diffY < 100) {
                if (diffX > 0 && currentPage < totalPages) {
                    showPage(currentPage + 1);
                } else if (diffX < 0 && currentPage > 1) {
                    showPage(currentPage - 1);
                }
            }
        });
        
        // Initialize
        loadPDF();
    </script>
</body>
</html>`;
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

      {/* PDF WebView */}
      <View style={styles.pdfContainer}>
        <TouchableOpacity
          style={styles.pdfTouchable}
          onPress={toggleControls}
          activeOpacity={1}
        >
          <WebView
            ref={webViewRef}
            source={{ html: createPDFViewerHTML() }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            onError={(error) => {
              console.error('WebView error:', error);
              Alert.alert('Error', 'Failed to load PDF viewer');
            }}
            onLoadEnd={() => {
              console.log('WebView loaded');
            }}
          />
        </TouchableOpacity>
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
                    {currentPage} / {totalPages}
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
                sendMessageToWebView({ type: 'ZOOM', scale: 1.0 });
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
  pdfContainer: {
    flex: 1,
  },
  pdfTouchable: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
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
