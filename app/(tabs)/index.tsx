import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useState, useRef, useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import { useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import WebViewError from '@/components/WebViewError'; // Assuming this component exists
import WebViewLoading from '@/components/WebViewLoading'; // Assuming this component exists

const HOME_URL = 'https://thecliffnews.in/';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ urlToLoad?: string }>();
  const [currentUrl, setCurrentUrl] = useState(params.urlToLoad || HOME_URL);
  // const [targetUrl, setTargetUrl] = useState(params.urlToLoad || HOME_URL);
  const insets = useSafeAreaInsets(); // Get safe area insets

  // JavaScript to inject for handling potential fixed headers under the notch/Dynamic Island
  // This attempts to add padding to the body. If the site has a specific fixed header,
  // you might need to target that element directly (e.g., document.querySelector('#site-header')).
  const injectedJavaScript = `
    (function() {
      const topPadding = ${insets.top};
      if (topPadding > 0) {
        document.body.style.paddingTop = topPadding + 'px';
        // Example for a specific fixed header:
        // const fixedHeader = document.querySelector('header#main-header'); // Adjust selector
        // if (fixedHeader) {
        //   fixedHeader.style.marginTop = topPadding + 'px';
        // }
      }
    })();
    true; // Required for injectedJavaScript to work reliably
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
    // You can add logic here if you want to restrict navigation or handle specific URLs
  };
  useEffect(() => {
    if (params.urlToLoad && params.urlToLoad !== currentUrl) {
      console.log(
        'HomeScreen: Received new urlToLoad from params:',
        params.urlToLoad
      );
      setCurrentUrl(params.urlToLoad);
      // webViewRef.current?.loadUrl(params.urlToLoad); // Or let source prop handle it
    }
  }, [params.urlToLoad]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* The top safe area is handled by injecting JS into the WebView for web content.
          The SafeAreaView itself protects the RN UI (like a custom header if you had one). */}
      {hasError ? (
        <WebViewError
          onReload={handleReload}
          // message="Failed to load content."
        />
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
            // Injected JS for safe area padding (Dynamic Island)
            // This runs after the page loads for the first time.
            // For scripts that need to run earlier, use injectedJavaScriptBeforeContentLoaded.
            injectedJavaScript={injectedJavaScript}
            onMessage={() => {}} // Required if injectedJavaScript is used and returns a value
            // Standard props for better compatibility and user experience
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true} // Useful if users log in on the website
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={Platform.OS !== 'android'} // iOS requires user action for autoplay
            pullToRefreshEnabled={true} // Allows pull-to-refresh gesture
            // Performance
            applicationNameForUserAgent="TheCliffNewsApp/1.0" // Optional: Custom User-Agent
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
    backgroundColor: COLORS.white, // Or your app's background color
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white, // Ensures WebView background matches if content is transparent initially
  },
});
