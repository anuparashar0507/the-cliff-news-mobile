import React from 'react';
import { StyleSheet, View, Share, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useState, useRef, useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import EPaperHeader from '@/components/EPaperHeader';

const EPAPER_URL = 'https://thecliffnews.in/index.php/elementor-12046/';

export default function EPaperScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(EPAPER_URL);
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  // JavaScript to inject for handling potential fixed headers and hiding site header
  const injectedJavaScript = `
    (function() {
      // Handle safe area
      const topPadding = ${insets.top};
      
      // Find and hide the site header
      function hideOriginalHeader() {
        // Target the site header - update selectors based on your WordPress theme
        const siteHeader = document.querySelector('header.site-header, #masthead, .main-header, #site-header');
        if (siteHeader) {
          siteHeader.style.display = 'none';
        }
        
        // Hide admin bar if present
        const adminBar = document.querySelector('#wpadminbar');
        if (adminBar) {
          adminBar.style.display = 'none';
        }
        
        // Adjust body padding/margin to compensate for hidden header
        document.body.style.paddingTop = '0px';
        document.body.style.marginTop = '0px';
      }
      
      // Run immediately and after any potential dynamic content loads
      hideOriginalHeader();
      
      // Also run after document fully loads
      if (document.readyState === 'complete') {
        hideOriginalHeader();
      } else {
        window.addEventListener('load', hideOriginalHeader);
      }
      
      // Run periodically in case of delayed rendering
      setTimeout(hideOriginalHeader, 500);
      setTimeout(hideOriginalHeader, 1500);
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this E-Paper from The Cliff News!',
        url: currentUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <EPaperHeader
        title="The Cliff E-Paper"
        onRefresh={handleReload}
        onShare={handleShare}
        currentUrl={currentUrl}
      />

      {hasError ? (
        <WebViewError onReload={handleReload} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
