import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useState, useRef, useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import { useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import { useAppContext } from '@/context/AppContext';
import { OneSignal } from 'react-native-onesignal';
const HOME_URL = 'https://thecliffnews.in/';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ urlToLoad?: string }>();
  const { requestNotificationPermission, loadUrl } = useAppContext();
  const [currentUrl, setCurrentUrl] = useState(
    params.urlToLoad || loadUrl || HOME_URL
  );
  const insets = useSafeAreaInsets();

  // Effect to handle notification-triggered URLs
  useEffect(() => {
    if (loadUrl) {
      console.log('Loading URL from notification:', loadUrl);
      setCurrentUrl(loadUrl);
    }
  }, [loadUrl]);

  // Effect to handle URL params
  useEffect(() => {
    if (params.urlToLoad && params.urlToLoad !== currentUrl) {
      console.log('Loading URL from params:', params.urlToLoad);
      setCurrentUrl(params.urlToLoad);
    }
  }, [params.urlToLoad]);

  // Request notification permission when the app first loads
  useEffect(() => {
    // Wait a bit before showing the permission prompt to not overwhelm the user
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const injectedJavaScript = `
  (function() {
    const topPadding = ${insets.top};
    if (topPadding > 0) {
      document.body.style.paddingTop = topPadding + 'px';
    }

    // Set up communication with OneSignal if it exists on the page
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ONESIGNAL_NOTIFICATION_PERMISSION') {
          // Send message to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ONESIGNAL_PERMISSION_REQUEST'
          }));
        }
      } catch (e) {
        // Not a JSON message or not for us
      }
    });

    // Intercept OneSignal initialization if it exists
    // This helps coordinate browser and app notifications
    document.addEventListener('onesignal.prompt.native', function(e) {
      e.preventDefault();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ONESIGNAL_PERMISSION_REQUEST'
      }));
    });

    // For tracking article views - useful for analytics
    const trackArticleView = () => {
      const articleTitle = document.querySelector('h1.entry-title')?.textContent;
      const articleCategory = document.querySelector('.cat-links a')?.textContent;
      
      if (articleTitle) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ARTICLE_VIEW',
          title: articleTitle,
          category: articleCategory || 'Uncategorized'
        }));
      }
    };

    // Track page views after content is fully loaded
    if (document.readyState === 'complete') {
      trackArticleView();
    } else {
      window.addEventListener('load', trackArticleView);
    }
  })();
  true; // Required
`;

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    setIsLoading(false);
    setHasError(true);
  };

  const handleReload = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    setCurrentUrl(navState.url);

    // Track page views for analytics and segmentation
    // This helps with targeting notifications
    if (Platform.OS !== 'web') {
      OneSignal.User.addTag('last_visited_page', navState.url);
    }
  };

  // Handle messages from the WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'ONESIGNAL_PERMISSION_REQUEST':
          // Handle permission request from the website
          requestNotificationPermission();
          break;

        case 'ARTICLE_VIEW':
          // Track article views for better notification targeting
          if (Platform.OS !== 'web' && data.title) {
            OneSignal.User.addTags({
              last_article_title: data.title,
              last_article_category: data.category || 'Uncategorized',
              last_article_timestamp: new Date().toISOString(),
            });
          }
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      // Not a JSON message or not for us
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {hasError ? (
        <WebViewError onReload={handleReload} />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={onNavigationStateChange}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={Platform.OS !== 'android'}
            pullToRefreshEnabled={true}
            applicationNameForUserAgent="TheCliffNewsApp/1.0"
          />
          {isLoading && <WebViewLoading />}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
