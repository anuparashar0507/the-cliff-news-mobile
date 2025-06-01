import React, { useState, useEffect } from 'react';
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
  useColorScheme,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import {
  ArrowLeft,
  Home,
  Share2,
  ZoomIn,
  ZoomOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { getBookById, EBook } from '@/utils/ebooksdata';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PDFReaderScreen = () => {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<EBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  const webViewRef = React.useRef<WebView>(null);
  const colorScheme = useColorScheme();

  // Handle hardware back button on Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleClose();
        return true; // Prevent default back action
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription?.remove();
    }, [])
  );

  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  useEffect(() => {
    if (bookId) {
      const foundBook = getBookById(bookId);
      if (foundBook) {
        setBook(foundBook);
        loadReaderSettings();
      } else {
        Alert.alert('Error', 'Book not found', [
          { text: 'OK', onPress: () => handleClose() },
        ]);
      }
    }
  }, [bookId]);

  const loadReaderSettings = async () => {
    try {
      const savedPage = await AsyncStorage.getItem(`book_${bookId}_page`);
      const savedScale = await AsyncStorage.getItem(`book_${bookId}_scale`);
      const savedBrightness = await AsyncStorage.getItem('reader_brightness');

      if (savedPage) setCurrentPage(parseInt(savedPage));
      if (savedScale) setScale(parseFloat(savedScale));
      if (savedBrightness) setBrightness(parseFloat(savedBrightness));
    } catch (error) {
      console.error('Error loading reader settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReaderSettings = async () => {
    try {
      await AsyncStorage.setItem(`book_${bookId}_page`, currentPage.toString());
      await AsyncStorage.setItem(`book_${bookId}_scale`, scale.toString());
      await AsyncStorage.setItem('reader_brightness', brightness.toString());
    } catch (error) {
      console.error('Error saving reader settings:', error);
    }
  };

  const handleClose = () => {
    saveReaderSettings();
    // Use replace to prevent navigation stack issues
    router.replace('/(tabs)/ebooks');
  };

  const handleHome = () => {
    saveReaderSettings();
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

  const handleScreenTap = () => {
    setShowControls(!showControls);
  };

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3.0);
    setScale(newScale);
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_SCALE', scale: newScale })
    );
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_SCALE', scale: newScale })
    );
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'GO_TO_PAGE', page: newPage })
      );
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'GO_TO_PAGE', page: newPage })
      );
    }
  };

  // Create a simple PDF placeholder since we can't load actual PDFs in WebView easily
  const createPDFViewerHTML = () => {
    if (!book) return '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${book.title}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${isDarkMode ? '#1a1a1a' : '#f5f5f5'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: ${isDarkMode ? '#ffffff' : '#333333'};
            line-height: 1.6;
            filter: brightness(${brightness});
        }
        
        .book-container {
            max-width: 800px;
            margin: 0 auto;
            background: ${isDarkMode ? '#2d2d2d' : '#ffffff'};
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transform: scale(${scale});
            transform-origin: top center;
        }
        
        .book-header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid ${isDarkMode ? '#444' : '#eee'};
            padding-bottom: 20px;
        }
        
        .book-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #FFA500;
        }
        
        .book-author {
            font-size: 18px;
            color: ${isDarkMode ? '#bbb' : '#666'};
            margin-bottom: 20px;
        }
        
        .book-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 14px;
            color: ${isDarkMode ? '#999' : '#888'};
        }
        
        .page-content {
            text-align: justify;
            font-size: 16px;
            line-height: 1.8;
            margin-top: 30px;
        }
        
        .page-number {
            text-align: center;
            margin-top: 40px;
            font-size: 14px;
            color: ${isDarkMode ? '#999' : '#666'};
        }
        
        .loading-message {
            text-align: center;
            padding: 60px 20px;
            font-size: 18px;
        }
        
        .error-message {
            text-align: center;
            padding: 40px 20px;
            color: #ff6b6b;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="book-container">
        <div class="book-header">
            <div class="book-title">${book.title}</div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-info">
                <span>Language: ${book.language}</span>
                <span>Category: ${book.category}</span>
            </div>
        </div>
        
        <div class="page-content">
            <div class="loading-message" id="loadingMessage">
                📖 Loading "${book.title}"...
                <br><br>
                <div style="font-size: 14px; color: ${
                  isDarkMode ? '#bbb' : '#666'
                };">
                    This is a demo reader. In the production version, the actual PDF content would be displayed here.
                    <br><br>
                    <strong>Book Information:</strong><br>
                    Title: ${book.title}<br>
                    Author: ${book.author}<br>
                    Language: ${book.language}<br>
                    Category: ${book.category}
                    <br><br>
                    Use the controls below to navigate through pages, zoom in/out, and adjust settings.
                </div>
            </div>
        </div>
        
        <div class="page-number">
            Page <span id="currentPage">${currentPage}</span> of <span id="totalPages">100</span>
        </div>
    </div>

    <script>
        let currentPage = ${currentPage};
        let totalPages = 100; // Demo total pages
        let scale = ${scale};
        
        // Send initial page info to React Native
        function sendPageInfo() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAGE_CHANGED',
                    currentPage: currentPage,
                    totalPages: totalPages
                }));
            }
        }
        
        // Update page display
        function updatePageDisplay() {
            document.getElementById('currentPage').textContent = currentPage;
            document.getElementById('totalPages').textContent = totalPages;
            sendPageInfo();
        }
        
        // Listen for messages from React Native
        window.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'GO_TO_PAGE':
                        currentPage = data.page;
                        updatePageDisplay();
                        break;
                    case 'SET_SCALE':
                        scale = data.scale;
                        document.querySelector('.book-container').style.transform = \`scale(\${scale})\`;
                        break;
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });
        
        // Touch/swipe navigation
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
            
            // Only process horizontal swipes (not vertical scrolling)
            if (Math.abs(diffX) > 50 && diffY < 100) {
                if (diffX > 0 && currentPage < totalPages) {
                    // Swipe left - next page
                    currentPage++;
                    updatePageDisplay();
                } else if (diffX < 0 && currentPage > 1) {
                    // Swipe right - previous page
                    currentPage--;
                    updatePageDisplay();
                }
            }
        });
        
        // Initialize
        updatePageDisplay();
        
        // Simulate loading complete
        setTimeout(() => {
            document.getElementById('loadingMessage').innerHTML = \`
                <p>This is page \${currentPage} of "${book.title}" by ${
      book.author
    }.</p>
                <p>📚 In the production version, the actual PDF content would be rendered here using a proper PDF library.</p>
                <p>You can:</p>
                <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
                    <li>Swipe left/right to navigate pages</li>
                    <li>Use the navigation buttons</li>
                    <li>Zoom in/out with the zoom controls</li>
                    <li>The app remembers your reading position</li>
                </ul>
                <p><em>Swipe left and right to test page navigation!</em></p>
            \`;
        }, 1000);
    </script>
</body>
</html>`;
  };

  useEffect(() => {
    if (!isLoading) {
      saveReaderSettings();
    }
  }, [currentPage, scale, brightness]);

  if (!book) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode
              ? COLORS.backgroundDark
              : COLORS.background,
          },
        ]}
      >
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: isDarkMode ? COLORS.textLight : COLORS.textDark },
            ]}
          >
            Loading book...
          </Text>
        </View>
      </View>
    );
  }

  const headerBackgroundColor = isDarkMode
    ? COLORS.surfaceDark
    : COLORS.primary;
  const textColor = isDarkMode ? COLORS.textLight : COLORS.white;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? COLORS.backgroundDark
            : COLORS.background,
        },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={headerBackgroundColor}
      />

      {/* Header */}
      {showControls && (
        <View
          style={[styles.header, { backgroundColor: headerBackgroundColor }]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <ArrowLeft size={24} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleHome} style={styles.headerButton}>
              <Home size={22} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text
              style={[styles.headerTitle, { color: textColor }]}
              numberOfLines={1}
            >
              {book.title}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: textColor }]}
              numberOfLines={1}
            >
              by {book.author}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Share2 size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowControls(!showControls)}
              style={styles.headerButton}
            >
              <BookOpen size={20} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PDF Viewer */}
      <TouchableOpacity
        style={styles.pdfContainer}
        onPress={handleScreenTap}
        activeOpacity={1}
      >
        <WebView
          ref={webViewRef}
          source={{ html: createPDFViewerHTML() }}
          style={styles.webview}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              switch (data.type) {
                case 'PAGE_CHANGED':
                  setCurrentPage(data.currentPage);
                  setTotalPages(data.totalPages);
                  break;
              }
            } catch (error) {
              console.error('Error handling WebView message:', error);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={true}
        />
      </TouchableOpacity>

      {/* Bottom Controls */}
      {showControls && (
        <View
          style={[
            styles.bottomControls,
            { backgroundColor: headerBackgroundColor },
          ]}
        >
          <View style={styles.controlsRow}>
            {/* Navigation Controls */}
            <TouchableOpacity
              onPress={previousPage}
              style={[
                styles.controlButton,
                { opacity: currentPage > 1 ? 1 : 0.5 },
              ]}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={24} color={textColor} />
            </TouchableOpacity>

            <View style={styles.pageInfo}>
              <Text style={[styles.pageText, { color: textColor }]}>
                {currentPage} / {totalPages || 1}
              </Text>
            </View>

            <TouchableOpacity
              onPress={nextPage}
              style={[
                styles.controlButton,
                { opacity: currentPage < totalPages ? 1 : 0.5 },
              ]}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRow}>
            {/* Zoom Controls */}
            <TouchableOpacity onPress={zoomOut} style={styles.controlButton}>
              <ZoomOut size={20} color={textColor} />
            </TouchableOpacity>

            <Text style={[styles.scaleText, { color: textColor }]}>
              {Math.round(scale * 100)}%
            </Text>

            <TouchableOpacity onPress={zoomIn} style={styles.controlButton}>
              <ZoomIn size={20} color={textColor} />
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.controlButton, styles.closeButton]}
            >
              <Text style={[styles.closeButtonText, { color: textColor }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: isDarkMode ? COLORS.textLight : COLORS.textDark },
            ]}
          >
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  pdfContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 40,
    alignItems: 'center',
  },
  pageInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  pageText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 14,
    fontWeight: 'bold',
  },
  scaleText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  closeButton: {
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontFamily: TYPOGRAPHY.emphasis.fontFamily,
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingText: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 16,
    marginTop: 12,
  },
});

export default PDFReaderScreen;
