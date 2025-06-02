// Fixed category navigation with better WebView handling
// Replace your current home screen with this:

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import OfflineMessage from '@/components/OfflineMessage';
import MobileAppHeader from '@/components/MobileAppHeader';
import CategoryNavigationHeader from '@/components/CategoryNavigationHeader';
import { useAppContext } from '@/context/AppContext';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { COLORS } from '@/constants/Theme';

const HOME_URL = 'https://thecliffnews.in/';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('THE CLIFF NEWS');
  const [isArticlePage, setIsArticlePage] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('home');
  const [hasLiveNews, setHasLiveNews] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [webViewKey, setWebViewKey] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([
    HOME_URL,
  ]);

  const webViewRef = useRef<WebView>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ urlToLoad?: string }>();
  const { requestNotificationPermission, loadUrl, isConnected } =
    useAppContext();
  const [currentUrl, setCurrentUrl] = useState(
    params.urlToLoad || loadUrl || HOME_URL
  );
  const scrollY = useSharedValue(0);

  const detectPageType = (url: string, title?: string) => {
    const isHome =
      url === HOME_URL || (url.endsWith('/') && !url.includes('/index.php/'));
    const isArticle =
      url.includes('/index.php/') &&
      url !== HOME_URL &&
      !url.includes('/category/');
    const isCategoryPage = url.includes('/category/') && !isArticle;

    setIsArticlePage(isArticle);
    setCurrentTitle(isArticle && title ? title : 'THE CLIFF NEWS');
    updateCurrentCategory(url);

    // Update navigation history
    setNavigationHistory((prev) => {
      const newHistory = [...prev];
      if (newHistory[newHistory.length - 1] !== url) {
        newHistory.push(url);
        // Keep only last 10 URLs to prevent memory issues
        if (newHistory.length > 10) {
          newHistory.shift();
        }
      }
      return newHistory;
    });

    console.log('📄 Page type detection:', {
      url,
      isHome,
      isArticle,
      isCategoryPage,
    });
    return { isHome, isArticle, isCategoryPage };
  };

  const updateCurrentCategory = (url: string) => {
    const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
    let newCategory = 'home';

    if (
      normalizedUrl === 'https://thecliffnews.in' ||
      normalizedUrl.endsWith('thecliffnews.in')
    ) {
      newCategory = 'home';
    } else if (normalizedUrl.includes('/category/national')) {
      newCategory = 'national';
    } else if (normalizedUrl.includes('/category/state')) {
      newCategory = 'state';
    } else if (normalizedUrl.includes('/category/entertainment')) {
      newCategory = 'entertainment';
    } else if (normalizedUrl.includes('/category/sports')) {
      newCategory = 'sports';
    } else if (normalizedUrl.includes('/category/technology')) {
      newCategory = 'technology';
    } else if (normalizedUrl.includes('/category/travel')) {
      newCategory = 'travel';
    } else if (normalizedUrl.includes('/category/stock-market')) {
      newCategory = 'stock';
    } else if (normalizedUrl.includes('/category/nit')) {
      newCategory = 'nit';
    } else if (normalizedUrl.includes('/category/do-it-yourself')) {
      newCategory = 'diy';
    }

    console.log('🏷️ Category update:', {
      url: normalizedUrl,
      oldCategory: currentCategory,
      newCategory,
    });
    setCurrentCategory(newCategory);
  };

  // Simplified injected JavaScript with better content detection
  const injectedJavaScript = useMemo(
    () => `
    (function() {
      let scrollTimeout;
      let contentCheckAttempts = 0;
      const maxContentCheckAttempts = 20; // 10 seconds total
      
      console.log('WebView script initialized for:', window.location.href);
      
      // Mobile optimizations
      function optimizeForMobile() {
        try {
          // Hide navigation elements
          const hideSelectors = [
            '#masthead', '.site-header', 'header.site-header', 
            '#wpadminbar', '.top-header', '.main-header', 
            '#site-navigation', '.main-navigation',
            '.ticker-item-wrap', '.top-ticker-news'
          ];
          
          hideSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el) el.style.display = 'none';
            });
          });
          
          // Add mobile styles
          if (!document.getElementById('mobile-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-styles';
            style.textContent = \`
              body {
                padding-top: 0 !important;
                margin-top: 0 !important;
                font-size: 16px !important;
                line-height: 1.6 !important;
              }
              .site-content {
                padding-top: 0 !important;
                margin-top: 0 !important;
              }
              article {
                padding: 10px !important;
                margin-bottom: 20px !important;
              }
              .entry-title, h1, h2 {
                font-size: 24px !important;
                margin-bottom: 15px !important;
                line-height: 1.3 !important;
              }
              img {
                max-width: 100% !important;
                height: auto !important;
              }
            \`;
            document.head.appendChild(style);
          }
        } catch (e) {
          console.log('Mobile optimization error:', e);
        }
      }
      
      // Enhanced content detection
      function checkForContent() {
        try {
          contentCheckAttempts++;
          
          // Look for various content indicators
          const contentSelectors = [
            'article',
            '.entry-content', 
            '.post-content',
            '.content-area',
            'main',
            '.site-main',
            '.posts-container',
            '.post',
            '.entry',
            '[class*="content"]'
          ];
          
          let hasContent = false;
          let contentElement = null;
          
          for (const selector of contentSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement && contentElement.textContent.trim().length > 100) {
              hasContent = true;
              break;
            }
          }
          
          // Additional checks
          if (!hasContent) {
            // Check for headlines/titles
            const headlines = document.querySelectorAll('h1, h2, h3, .entry-title, .post-title, [class*="title"]');
            hasContent = headlines.length > 0;
          }
          
          if (!hasContent) {
            // Check for images
            const images = document.querySelectorAll('img');
            hasContent = images.length > 2; // More than just logo/icons
          }
          
          if (!hasContent) {
            // Check total text content
            const bodyText = document.body.textContent.trim();
            hasContent = bodyText.length > 1000 && !bodyText.toLowerCase().includes('loading');
          }
          
          console.log('Content check attempt', contentCheckAttempts, 'hasContent:', hasContent);
          
          if (hasContent) {
            console.log('Content detected! Notifying React Native...');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'CONTENT_READY',
              url: window.location.href,
              contentFound: true,
              attempts: contentCheckAttempts
            }));
            return true;
          } else if (contentCheckAttempts >= maxContentCheckAttempts) {
            console.log('Max content check attempts reached, forcing content ready');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'CONTENT_READY',
              url: window.location.href,
              contentFound: false,
              forced: true,
              attempts: contentCheckAttempts
            }));
            return true;
          }
          
          return false;
        } catch (e) {
          console.log('Content check error:', e);
          return false;
        }
      }
      
      // Scroll handling
      function handleScroll() {
        const y = window.pageYOffset || document.documentElement.scrollTop;
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'SCROLL_EVENT',
          scrollY: y
        }));
      }
      
      // Initialize everything
      function initialize() {
        console.log('Initializing WebView for:', window.location.href);
        optimizeForMobile();
        
        // Start content checking
        if (!checkForContent()) {
          // Check periodically
          const contentInterval = setInterval(() => {
            if (checkForContent()) {
              clearInterval(contentInterval);
            }
          }, 500);
          
          // Stop after max attempts
          setTimeout(() => {
            clearInterval(contentInterval);
          }, maxContentCheckAttempts * 500);
        }
        
        // Send page info
        setTimeout(() => {
          const title = document.querySelector('h1, .entry-title, .page-title')?.textContent?.trim();
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'PAGE_INFO',
            title: title || 'THE CLIFF NEWS',
            url: window.location.href
          }));
        }, 1000);
      }
      
      // Event listeners
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 100);
      }, { passive: true });
      
      // Initialize when ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
      
      // Also try on window load
      window.addEventListener('load', () => {
        setTimeout(initialize, 500);
      });
      
    })();
    true;
  `,
    []
  );

  // Loading handlers
  const handleLoadStart = useCallback(() => {
    console.log('🚀 Load started for:', currentUrl);
    setLoadStartTime(Date.now());
    setIsLoading(true);
    setHasError(false);

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Set timeout (20 seconds)
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Loading timeout - showing error');
      setHasError(true);
      setIsLoading(false);
    }, 20000);
  }, [currentUrl]);

  const handleLoadEnd = useCallback(() => {
    const loadTime = Date.now() - loadStartTime;
    console.log(`📄 Load end - ${loadTime}ms`);

    // Clear timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Don't hide loading immediately - wait for content detection
    // But set a fallback in case content detection fails
    setTimeout(() => {
      if (isLoading) {
        console.log('📄 Fallback: Hiding loading after load end timeout');
        setIsLoading(false);
      }
    }, 3000); // 3 second fallback
  }, [loadStartTime, isLoading]);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('❌ WebView error:', nativeEvent);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'CONTENT_READY':
            console.log('🎉 Content ready!', data);
            // Hide loading immediately when content is detected
            setIsLoading(false);
            break;

          case 'PAGE_INFO':
            console.log('📄 Page info:', data);
            detectPageType(data.url, data.title);
            setCurrentTitle(data.title);
            break;

          case 'SCROLL_EVENT':
            scrollY.value = data.scrollY;
            break;
        }
      } catch (error) {
        // Ignore invalid JSON
      }
    },
    [scrollY]
  );

  // Improved category navigation
  const handleCategoryPress = useCallback(
    (url: string, title: string) => {
      if (url === currentUrl) {
        console.log('🔄 Same URL clicked, refreshing...');
        webViewRef.current?.reload();
        return;
      }

      console.log('🔗 Navigating to category:', title, 'URL:', url);

      // Update state immediately
      setCurrentTitle(title);
      setCurrentUrl(url);

      // Add to navigation history
      setNavigationHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory[newHistory.length - 1] !== url) {
          newHistory.push(url);
          if (newHistory.length > 10) {
            newHistory.shift();
          }
        }
        return newHistory;
      });

      // Force WebView refresh with new key
      setWebViewKey((prev) => prev + 1);
    },
    [currentUrl]
  );

  const handleReload = useCallback(() => {
    console.log('🔄 Manual reload');
    setIsLoading(true);
    setHasError(false);
    setWebViewKey((prev) => prev + 1);
  }, []);

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      console.log('🌐 Navigation state:', navState.url);

      if (navState.url && navState.url !== currentUrl) {
        setCurrentUrl(navState.url);
        detectPageType(navState.url, navState.title);
      }
    },
    [currentUrl]
  );

  const handleBackPress = useCallback(() => {
    console.log('🔙 Back pressed, navigation history:', navigationHistory);

    if (navigationHistory.length > 1) {
      // Go to previous URL in our history
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current URL
      const previousUrl = newHistory[newHistory.length - 1];

      console.log('🔙 Going back to:', previousUrl);

      // Update everything IMMEDIATELY and SYNCHRONOUSLY
      const newCategory = getCurrentCategoryFromUrl(previousUrl);
      console.log('🎯 Immediately setting category to:', newCategory);

      // Update all states immediately - DO NOT set isBackNavigation flag
      setNavigationHistory(newHistory);
      setCurrentUrl(previousUrl);
      setCurrentCategory(newCategory); // Set category IMMEDIATELY

      // Set title based on category
      if (newCategory === 'home') {
        setCurrentTitle('THE CLIFF NEWS');
      } else if (newCategory === 'national') {
        setCurrentTitle('National News');
      } else if (newCategory === 'state') {
        setCurrentTitle('State News');
      } else if (newCategory === 'entertainment') {
        setCurrentTitle('Entertainment');
      } else if (newCategory === 'sports') {
        setCurrentTitle('Sports');
      } else if (newCategory === 'technology') {
        setCurrentTitle('Technology');
      } else if (newCategory === 'travel') {
        setCurrentTitle('Travel');
      } else if (newCategory === 'stock') {
        setCurrentTitle('Stock Market');
      } else if (newCategory === 'nit') {
        setCurrentTitle('NIT');
      } else if (newCategory === 'diy') {
        setCurrentTitle('DIY');
      } else {
        setCurrentTitle('THE CLIFF NEWS');
      }

      console.log('🔄 Back navigation complete:', {
        url: previousUrl,
        category: newCategory,
        title: newCategory === 'national' ? 'National News' : 'Other',
      });

      // Force WebView refresh AFTER state is updated
      setWebViewKey((prev) => prev + 1);
    } else {
      // No history, try WebView back or go to home
      if (webViewRef.current) {
        webViewRef.current.goBack();
      } else {
        handleHomePress();
      }
    }
  }, [navigationHistory]);

  // Helper function to get category from URL
  const getCurrentCategoryFromUrl = (url: string) => {
    if (
      url === HOME_URL ||
      (url.endsWith('/') && !url.includes('/index.php/'))
    ) {
      return 'home';
    } else if (url.includes('/category/national')) {
      return 'national';
    } else if (url.includes('/category/state')) {
      return 'state';
    } else if (url.includes('/category/entertainment')) {
      return 'entertainment';
    } else if (url.includes('/category/sports')) {
      return 'sports';
    } else if (url.includes('/category/technology')) {
      return 'technology';
    } else if (url.includes('/category/travel')) {
      return 'travel';
    } else if (url.includes('/category/stock-market')) {
      return 'stock';
    } else if (url.includes('/category/nit')) {
      return 'nit';
    } else if (url.includes('/category/do-it-yourself')) {
      return 'diy';
    }
    return 'home';
  };

  const handleHomePress = useCallback(() => {
    handleCategoryPress(HOME_URL, 'THE CLIFF NEWS');
    setCurrentCategory('home');
    setNavigationHistory([HOME_URL]); // Reset history when going home
  }, [handleCategoryPress]);

  // Effects
  useEffect(() => {
    const timer = setTimeout(requestNotificationPermission, 3000);
    return () => clearTimeout(timer);
  }, [requestNotificationPermission]);

  // Ensure category is updated when URL changes
  useEffect(() => {
    console.log('🔗 URL changed, updating category:', currentUrl);
    updateCurrentCategory(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    if (loadUrl && loadUrl !== currentUrl) {
      setCurrentUrl(loadUrl);
      setWebViewKey((prev) => prev + 1);
    }
  }, [loadUrl, currentUrl]);

  useEffect(() => {
    if (params.urlToLoad && params.urlToLoad !== currentUrl) {
      setCurrentUrl(params.urlToLoad);
      setWebViewKey((prev) => prev + 1);
    }
  }, [params.urlToLoad, currentUrl]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (!isConnected) {
    return <OfflineMessage />;
  }

  // Determine what to show based on current page type
  const isHome =
    currentUrl === HOME_URL ||
    (currentUrl.endsWith('/') && !currentUrl.includes('/index.php/'));
  const isCategoryPage = currentUrl.includes('/category/') && !isArticlePage;
  const shouldShowCategoryHeader = isHome || isCategoryPage; // Only show on home and category pages
  const shouldShowBackButton =
    !isHome && (navigationHistory.length > 1 || isArticlePage); // Never show on home
  const shouldShowHomeButton = !isHome; // Show everywhere except home

  console.log('🎯 Navigation state:', {
    isHome,
    isCategoryPage,
    isArticlePage,
    shouldShowCategoryHeader,
    shouldShowBackButton,
    currentUrl,
    currentCategory,
  });

  return (
    <View style={styles.container}>
      <MobileAppHeader
        title={currentTitle}
        showBackButton={shouldShowBackButton}
        showHomeButton={shouldShowHomeButton}
        onRefreshPress={handleReload}
        onBackPress={handleBackPress}
        onHomePress={handleHomePress}
        scrollY={scrollY}
      />

      {/* Only show category header on home and category pages */}
      {shouldShowCategoryHeader && (
        <CategoryNavigationHeader
          key={`category-nav-${currentCategory}`} // Force re-render when category changes
          onCategoryPress={handleCategoryPress}
          scrollY={scrollY}
          activeCategory={currentCategory}
        />
      )}

      {hasError ? (
        <WebViewError onReload={handleReload} />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            key={`webview-${webViewKey}`} // Force refresh on key change
            source={{ uri: currentUrl }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={onNavigationStateChange}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleWebViewMessage}
            // Configuration
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            pullToRefreshEnabled={true}
            applicationNameForUserAgent="TheCliffNewsApp/1.0"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            // Performance
            cacheEnabled={false} // Disable cache for category navigation
            allowsBackForwardNavigationGestures={true}
            allowsLinkPreview={false}
            // Force new page load
            incognito={false}
            {...(Platform.OS === 'android' && {
              mixedContentMode: 'compatibility',
            })}
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
