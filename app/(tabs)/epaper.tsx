import React from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useState, useRef, useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import WebViewError from '@/components/WebViewError'; // Assuming this component exists
import WebViewLoading from '@/components/WebViewLoading'; // Assuming this component exists

const EPAPER_URL = 'https://thecliffnews.in/index.php/e-paper/';

export default function EPaperScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(EPAPER_URL);
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets(); // Get safe area insets

  // JavaScript to inject for handling potential fixed headers under the notch/Dynamic Island
  const injectedJavaScript = `
    (function() {
      const topPadding = ${insets.top};
      if (topPadding > 0) {
        document.body.style.paddingTop = topPadding + 'px';
        // If the e-paper site has a specific fixed header, target it:
        // const ePaperHeader = document.querySelector('#ePaper-fixed-header'); // Adjust selector
        // if (ePaperHeader) {
        //   ePaperHeader.style.marginTop = topPadding + 'px';
        // }
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {hasError ? (
        <WebViewError
          onReload={handleReload}
          // message="Failed to load E-Paper."
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: EPAPER_URL }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={onNavigationStateChange}
            injectedJavaScript={injectedJavaScript}
            onMessage={() => {}}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={Platform.OS !== 'android'}
            pullToRefreshEnabled={true}
            applicationNameForUserAgent="TheCliffNewsApp-EPaper/1.0"
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
