// app/(tabs)/ebooks/reader.tsx (MOVED TO CORRECT LOCATION)
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { COLORS, TYPOGRAPHY } from '@/constants/Theme';
import { ArrowLeft, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react-native';
import { getBookById, EBook } from '@/utils/ebooksdata';

export default function PDFReaderScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<EBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webViewRef, setWebViewRef] = useState<WebView | null>(null);

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

  const handleZoomIn = () => {
    webViewRef?.postMessage(JSON.stringify({ action: 'zoomIn' }));
  };

  const handleZoomOut = () => {
    webViewRef?.postMessage(JSON.stringify({ action: 'zoomOut' }));
  };

  const handleReload = () => {
    webViewRef?.reload();
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            by {book.author}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleZoomOut} style={styles.headerButton}>
            <ZoomOut size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleZoomIn} style={styles.headerButton}>
            <ZoomIn size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReload} style={styles.headerButton}>
            <RotateCcw size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <WebView
        ref={setWebViewRef}
        source={{ uri: book.pdfPath }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          Alert.alert('Error', 'Failed to load PDF');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={Platform.OS === 'android'}
        injectedJavaScript={`
          document.addEventListener('message', function(event) {
            const data = JSON.parse(event.data);
            if (data.action === 'zoomIn') {
              document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) + 0.1).toString();
            } else if (data.action === 'zoomOut') {
              document.body.style.zoom = Math.max(0.5, parseFloat(document.body.style.zoom || 1) - 0.1).toString();
            }
          });
        `}
      />

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
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.heading.fontFamily,
    fontSize: 18,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
  },
  webview: {
    flex: 1,
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
