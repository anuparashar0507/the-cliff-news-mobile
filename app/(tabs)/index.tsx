import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Platform, Alert } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useCallback } from 'react';
import { COLORS } from '@/constants/Theme';
import { useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import OfflineMessage from '@/components/OfflineMessage';
import MobileAppHeader from '@/components/MobileAppHeader';
import { useAppContext } from '@/context/AppContext';
import { OneSignal } from 'react-native-onesignal';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

const HOME_URL = 'https://thecliffnews.in/';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ urlToLoad?: string }>();
  const { requestNotificationPermission, loadUrl, isConnected } =
    useAppContext();
  const [currentUrl, setCurrentUrl] = useState(
    params.urlToLoad || loadUrl || HOME_URL
  );
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  // Enhanced JavaScript injection to remove WordPress header and improve mobile experience
  const injectedJavaScript = `
    (function() {
      console.log('Mobile app WebView script loaded');
      
      // Function to remove WordPress header and improve mobile experience
      function optimizeForMobile() {
        // Remove the main site header
        const siteHeader = document.querySelector('#masthead, .site-header, header.site-header');
        if (siteHeader) {
          siteHeader.style.display = 'none';
          console.log('Site header removed');
        }
        
        // Remove admin bar
        const adminBar = document.querySelector('#wpadminbar');
        if (adminBar) {
          adminBar.style.display = 'none';
          console.log('Admin bar removed');
        }
        
        // Remove top header section specifically
        const topHeader = document.querySelector('.top-header');
        if (topHeader) {
          topHeader.style.display = 'none';
          console.log('Top header removed');
        }
        
        // Remove main header section
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
          mainHeader.style.display = 'none';
          console.log('Main header removed');
        }
        
        // Remove navigation menu
        const navigation = document.querySelector('#site-navigation, .main-navigation');
        if (navigation) {
          navigation.style.display = 'none';
          console.log('Navigation removed');
        }
        
        // Adjust body styling for mobile
        document.body.style.paddingTop = '0px';
        document.body.style.marginTop = '0px';
        
        // Add mobile-optimized styles
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = \`
          body {
            font-size: 16px !important;
            line-height: 1.6 !important;
          }
          .site-content {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          article {
            padding: 15px !important;
          }
          .entry-title {
            font-size: 24px !important;
            margin-bottom: 15px !important;
          }
          .entry-content {
            font-size: 16px !important;
            line-height: 1.6 !important;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          .ticker-item-wrap, .top-ticker-news {
            display: none !important;
          }
        \`;
        document.head.appendChild(mobileStyles);
        
        console.log('Mobile optimization completed');
      }
      
      // Run optimization immediately and after content loads
      optimizeForMobile();
      
      // Observer for dynamic content
      const observer = new MutationObserver(() => {
        optimizeForMobile();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Run after DOM is fully loaded
      if (document.readyState === 'complete') {
        optimizeForMobile();
      } else {
        document.addEventListener('DOMContentLoaded', optimizeForMobile);
        window.addEventListener('load', optimizeForMobile);
      }
      
      // Run periodically to catch any dynamically loaded content
      setInterval(optimizeForMobile, 2000);
      
      // OneSignal integration
      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ONESIGNAL_NOTIFICATION_PERMISSION') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ONESIGNAL_PERMISSION_REQUEST'
            }));
          }
        } catch (e) {
          // Not a JSON message
        }
      });
      
      // Track article views for better notification targeting
      const trackArticleView = () => {
        const articleTitle = document.querySelector('h1.entry-title, .entry-title h1, h1')?.textContent;
        const articleCategory = document.querySelector('.cat-links a, .category a')?.textContent;
        
        if (articleTitle) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ARTICLE_VIEW',
            title: articleTitle.trim(),
            category: articleCategory?.trim() || 'Uncategorized',
            url: window.location.href
          }));
        }
      };
      
      // Track scroll events for header animation
      let lastScrollY = 0;
      window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SCROLL_EVENT',
          scrollY: scrollY,
          direction: scrollY > lastScrollY ? 'down' : 'up'
        }));
        lastScrollY = scrollY;
      });
      
      if (document.readyState === 'complete') {
        trackArticleView();
      } else {
        window.addEventListener('load', trackArticleView);
      }
      
    })();
    true;
  `;

  useEffect(() => {
    if (loadUrl) {
      console.log('Loading URL from notification:', loadUrl);
      setCurrentUrl(loadUrl);
    }
  }, [loadUrl]);

  useEffect(() => {
    if (params.urlToLoad && params.urlToLoad !== currentUrl) {
      console.log('Loading URL from params:', params.urlToLoad);
      setCurrentUrl(params.urlToLoad);
    }
  }, [params.urlToLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 3000); // Increased delay for better UX

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

    if (Platform.OS !== 'web') {
      OneSignal.User.addTag('last_visited_page', navState.url);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'ONESIGNAL_PERMISSION_REQUEST':
          requestNotificationPermission();
          break;

        case 'ARTICLE_VIEW':
          if (Platform.OS !== 'web' && data.title) {
            OneSignal.User.addTags({
              last_article_title: data.title,
              last_article_category: data.category || 'Uncategorized',
              last_article_timestamp: new Date().toISOString(),
              last_article_url: data.url || currentUrl,
            });
            console.log('Article view tracked:', data.title);
          }
          break;

        case 'SCROLL_EVENT':
          scrollY.value = data.scrollY;
          break;

        default:
          break;
      }
    } catch (error) {
      // Not a JSON message
    }
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
    // You can implement a slide-out menu here
  };

  const handleSearchPress = () => {
    // Implement search functionality
    webViewRef.current?.postMessage(
      JSON.stringify({
        action: 'focusSearch',
      })
    );
  };

  const handleNotificationPress = () => {
    // Show notification preferences or recent notifications
    Alert.alert(
      'Notifications',
      'Stay updated with the latest news from The Cliff News',
      [
        { text: 'Settings', onPress: requestNotificationPermission },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const handleSharePress = () => {
    // Implement share functionality
    if (Platform.OS !== 'web') {
      import('react-native').then(({ Share }) => {
        Share.share({
          message:
            'Check out The Cliff News - National Daily Bilingual Newspaper',
          url: currentUrl,
          title: 'The Cliff News',
        });
      });
    }
  };

  if (!isConnected) {
    return <OfflineMessage />;
  }

  return (
    <View style={styles.container}>
      <MobileAppHeader
        title="THE CLIFF NEWS"
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
        onNotificationPress={handleNotificationPress}
        onSharePress={handleSharePress}
        onRefreshPress={handleReload}
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
            decelerationRate="normal"
            bounces={true}
            scrollEnabled={true}
            nestedScrollEnabled={true}
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
