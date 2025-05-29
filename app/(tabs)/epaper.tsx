import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useState, useRef, useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import MobileAppHeader from '@/components/MobileAppHeader';

const EPAPER_URL = 'https://thecliffnews.in/index.php/elementor-12046/';

export default function EPaperScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(EPAPER_URL);
  const webViewRef = useRef<WebView>(null);

  const injectedJavaScript = `
    (function() {
      function optimizeEPaper() {
        const elementsToHide = [
          'header.site-header', '#masthead', '.main-header',
          '#wpadminbar', '.top-header', '#site-navigation'
        ];
        
        elementsToHide.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) element.style.display = 'none';
        });
        
        const epaperStyles = document.createElement('style');
        epaperStyles.textContent = \`
          body { padding-top: 0 !important; margin-top: 0 !important; }
          .elementor-section { margin-top: 0 !important; }
          .elementor-container { padding-top: 0 !important; }
        \`;
        document.head.appendChild(epaperStyles);
      }
      
      optimizeEPaper();
      
      if (document.readyState === 'complete') {
        optimizeEPaper();
      } else {
        window.addEventListener('load', optimizeEPaper);
      }
      
      setInterval(optimizeEPaper, 2000);
    })();
    true;
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
    <View style={styles.container}>
      <MobileAppHeader
        title="The Cliff E-Paper"
        onRefreshPress={handleReload}
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
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
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
