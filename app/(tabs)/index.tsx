import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Platform, Alert } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import OfflineMessage from '@/components/OfflineMessage';
import MobileAppHeader from '@/components/MobileAppHeader';
import { useAppContext } from '@/context/AppContext';
import Animated, { useSharedValue } from 'react-native-reanimated';
import Constants from 'expo-constants';

// FIXED: Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import OneSignal
let OneSignal: any = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    OneSignal = require('react-native-onesignal').OneSignal;
  } catch (error) {
    console.log('OneSignal not available in Expo Go');
  }
}

const HOME_URL = 'https://thecliffnews.in/';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('THE CLIFF NEWS');
  const [isArticlePage, setIsArticlePage] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ urlToLoad?: string }>();
  const {
    requestNotificationPermission,
    loadUrl,
    isConnected,
    isExpoGo: contextIsExpoGo,
  } = useAppContext();
  const [currentUrl, setCurrentUrl] = useState(
    params.urlToLoad || loadUrl || HOME_URL
  );
  const scrollY = useSharedValue(0);

  const detectPageType = (url: string, title?: string) => {
    const isHome =
      url === HOME_URL || (url.endsWith('/') && !url.includes('/index.php/'));
    const isArticle = url.includes('/index.php/') && url !== HOME_URL;

    setIsArticlePage(isArticle);
    setCurrentTitle(isArticle && title ? title : 'THE CLIFF NEWS');
  };

  // FIXED: Simplified injected JavaScript without problematic properties

  const injectedJavaScript = `
  (function() {
    console.log('Enhanced Mobile WebView Script Loaded');
    
    function applyTheme(isDark) {
      const themeMode = isDark ? 'dark' : 'light';
      
      try {
        localStorage.setItem('themeMode', themeMode);
      } catch (e) {
        console.log('Could not save theme to localStorage:', e);
      }
      
      let themeStyleId = 'rn-theme-styles';
      let existingThemeStyle = document.getElementById(themeStyleId);
      if (existingThemeStyle) {
        existingThemeStyle.remove();
      }
      
      const themeStyles = document.createElement('style');
      themeStyles.id = themeStyleId;
      themeStyles.textContent = \`
        :root {
          --theme-bg: \${isDark ? '#0F0F0F' : '#FFFFFF'};
          --theme-surface: \${isDark ? '#1A1A1A' : '#FFFFFF'};
          --theme-text: \${isDark ? '#FFFFFF' : '#1F2937'};
          --theme-text-secondary: \${isDark ? '#B0B0B0' : '#6B7280'};
          --theme-border: \${isDark ? '#333333' : '#E5E7EB'};
        }
        
      \`;
      document.head.appendChild(themeStyles);
    }
    
    function optimizeForMobile() {
      // Only hide navigation elements
      const elementsToHide = [
        '#masthead', '.site-header', 'header.site-header',
        '#wpadminbar', '.top-header', '.main-header', 
        '#site-navigation', '.main-navigation',
        '.ticker-item-wrap', '.top-ticker-news'
      ];
      
      elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = 'none';
        }
      });
      
      if (!document.getElementById('mobile-app-styles')) {
        const mobileStyles = document.createElement('style');
        mobileStyles.id = 'mobile-app-styles';
        mobileStyles.textContent = \`
          body {
            font-size: 16px !important;
            line-height: 1.6 !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          .site-content {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          article {
            padding: 0px !important;
            margin-bottom: 20px !important;
          }
          .entry-title, h1 {
            font-size: 24px !important;
            margin-bottom: 15px !important;
            line-height: 1.3 !important;
          }
        \`;
        document.head.appendChild(mobileStyles);
      }
    }
    
    function initializeTheme() {
      let savedTheme = null;
      try {
        savedTheme = localStorage.getItem('themeMode');
      } catch (e) {
        console.log('Could not read theme from localStorage:', e);
      }
      
      const isDark = savedTheme === 'dark';
      applyTheme(isDark);
    }
    
    optimizeForMobile();
    initializeTheme();
    
    // Theme change listener
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'THEME_CHANGE') {
          applyTheme(data.isDark);
        }
      } catch (e) {
        // Not a valid JSON message, ignore
      }
    });
    
    window.applyTheme = applyTheme;
    
    // Rest of your existing WebView functionality...
    const observer = new MutationObserver(() => {
      optimizeForMobile();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    function sendPageInfo() {
      const title = document.querySelector('h1.entry-title, .entry-title h1, h1')?.textContent?.trim();
      const category = document.querySelector('.cat-links a, .category a')?.textContent?.trim();
      const isArticle = window.location.href.includes('/index.php/') && 
                       window.location.href !== '${HOME_URL}';
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAGE_INFO',
          title: title || 'THE CLIFF NEWS',
          category: category || 'News',
          url: window.location.href,
          isArticle: isArticle
        }));
      }
    }
    
    if (document.readyState === 'complete') {
      sendPageInfo();
    } else {
      window.addEventListener('load', sendPageInfo);
    }
    
    setInterval(optimizeForMobile, 3000);
    
  })();
  true;
`;

  useEffect(() => {
    if (loadUrl) {
      setCurrentUrl(loadUrl);
    }
  }, [loadUrl]);

  useEffect(() => {
    if (params.urlToLoad && params.urlToLoad !== currentUrl) {
      setCurrentUrl(params.urlToLoad);
    }
  }, [params.urlToLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
    detectPageType(navState.url, navState.title);

    // FIXED: Only use OneSignal if available (not in Expo Go)
    if (OneSignal && !isExpoGo) {
      try {
        OneSignal.User.addTag('last_visited_page', navState.url);
      } catch (error) {
        console.log('OneSignal error:', error);
      }
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'PAGE_INFO':
          detectPageType(data.url, data.title);
          setCurrentTitle(data.title);
          break;

        case 'ARTICLE_VIEW':
          if (OneSignal && !isExpoGo && data.title) {
            try {
              OneSignal.User.addTags({
                last_article_title: data.title,
                last_article_category: data.category || 'Uncategorized',
                last_article_timestamp: new Date().toISOString(),
                last_article_url: data.url || currentUrl,
              });
            } catch (error) {
              console.log('OneSignal error:', error);
            }
          }
          break;

        case 'SCROLL_EVENT':
          scrollY.value = data.scrollY;
          break;

        case 'ONESIGNAL_PERMISSION_REQUEST':
          requestNotificationPermission();
          break;

        default:
          break;
      }
    } catch (error) {
      // Not a JSON message, ignore
    }
  };

  const handleBackPress = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleHomePress = () => {
    setCurrentUrl(HOME_URL);
    webViewRef.current?.reload();
  };

  if (!isConnected) {
    return <OfflineMessage />;
  }

  return (
    <View style={styles.container}>
      <MobileAppHeader
        title={currentTitle}
        showBackButton={isArticlePage}
        showHomeButton={isArticlePage}
        onRefreshPress={handleReload}
        onBackPress={handleBackPress}
        onHomePress={handleHomePress}
        scrollY={scrollY}
      />

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
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bounces={true}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            // FIXED: Removed all problematic properties like decelerationRate
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
    backgroundColor: COLORS.white,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
