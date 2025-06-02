// Enhanced home screen with better category navigation
// Key improvements:
// 1. More reliable category detection and setting
// 2. Better auto-scroll timing for category header
// 3. Improved state synchronization

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

// Category mapping for better reliability
const CATEGORY_MAPPING = {
  'https://thecliffnews.in/': 'home',
  'https://thecliffnews.in/index.php/category/national/': 'national',
  'https://thecliffnews.in/index.php/category/state/': 'state',
  'https://thecliffnews.in/index.php/category/entertainment/': 'entertainment',
  'https://thecliffnews.in/index.php/category/sports/': 'sports',
  'https://thecliffnews.in/index.php/category/technology/': 'technology',
  'https://thecliffnews.in/index.php/category/travel/': 'travel',
  'https://thecliffnews.in/index.php/category/stock-market/': 'stock',
  'https://thecliffnews.in/index.php/category/nit/': 'nit',
  'https://thecliffnews.in/index.php/category/do-it-yourself/': 'diy',
};

const CATEGORY_TITLES = {
  home: 'THE CLIFF NEWS',
  national: 'National News',
  state: 'State News',
  entertainment: 'Entertainment',
  sports: 'Sports',
  technology: 'Technology',
  travel: 'Travel',
  stock: 'Stock Market',
  nit: 'NIT',
  diy: 'Do It Yourself',
};

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
  const [categoryUpdateKey, setCategoryUpdateKey] = useState(0); // Force category header update

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

  // Helper function to get category from URL with better accuracy
  const getCategoryFromUrl = useCallback((url: string): string => {
    // Normalize URL by removing trailing slashes and converting to lowercase
    const normalizedUrl = url.toLowerCase().replace(/\/$/, '') + '/';

    // Direct mapping first
    if (CATEGORY_MAPPING[normalizedUrl as keyof typeof CATEGORY_MAPPING]) {
      return CATEGORY_MAPPING[normalizedUrl as keyof typeof CATEGORY_MAPPING];
    }

    // Fallback pattern matching
    if (normalizedUrl.includes('/category/national')) return 'national';
    if (normalizedUrl.includes('/category/state')) return 'state';
    if (normalizedUrl.includes('/category/entertainment'))
      return 'entertainment';
    if (normalizedUrl.includes('/category/sports')) return 'sports';
    if (normalizedUrl.includes('/category/technology')) return 'technology';
    if (normalizedUrl.includes('/category/travel')) return 'travel';
    if (normalizedUrl.includes('/category/stock-market')) return 'stock';
    if (normalizedUrl.includes('/category/nit')) return 'nit';
    if (normalizedUrl.includes('/category/do-it-yourself')) return 'diy';

    // Check if it's home page
    if (
      normalizedUrl === 'https://thecliffnews.in/' ||
      (normalizedUrl.endsWith('thecliffnews.in/') &&
        !normalizedUrl.includes('/index.php/'))
    ) {
      return 'home';
    }

    return 'home'; // Default fallback
  }, []);

  const detectPageType = useCallback(
    (url: string, title?: string) => {
      const isHome =
        getCategoryFromUrl(url) === 'home' && !url.includes('/index.php/');
      const isArticle =
        url.includes('/index.php/') &&
        url !== HOME_URL &&
        !url.includes('/category/');
      const isCategoryPage = url.includes('/category/') && !isArticle;

      const newCategory = getCategoryFromUrl(url);

      console.log('📄 Page type detection:', {
        url,
        isHome,
        isArticle,
        isCategoryPage,
        newCategory,
        oldCategory: currentCategory,
      });

      setIsArticlePage(isArticle);
      setCurrentTitle(
        isArticle && title
          ? title
          : CATEGORY_TITLES[newCategory as keyof typeof CATEGORY_TITLES] ||
              'THE CLIFF NEWS'
      );

      // Update category with force refresh if changed
      if (newCategory !== currentCategory) {
        console.log(
          '🎯 Category changed from',
          currentCategory,
          'to',
          newCategory
        );
        setCurrentCategory(newCategory);
        setCategoryUpdateKey((prev) => prev + 1); // Force category header update
      }

      // Update navigation history
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

      return { isHome, isArticle, isCategoryPage, category: newCategory };
    },
    [currentCategory, getCategoryFromUrl]
  );

  // Enhanced injected JavaScript (keep your existing optimized version)
  const injectedJavaScript = useMemo(
    () => `
    (function() {
      let scrollTimeout;
      let contentCheckAttempts = 0;
      const maxContentCheckAttempts = 20;
      
      console.log('WebView script initialized for:', window.location.href);
      
      function optimizeForMobile() {
        try {
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
      
      function checkForContent() {
        try {
          contentCheckAttempts++;
          
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
          
          if (!hasContent) {
            const headlines = document.querySelectorAll('h1, h2, h3, .entry-title, .post-title, [class*="title"]');
            hasContent = headlines.length > 0;
          }
          
          if (!hasContent) {
            const images = document.querySelectorAll('img');
            hasContent = images.length > 2;
          }
          
          if (!hasContent) {
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
      
      function handleScroll() {
        const y = window.pageYOffset || document.documentElement.scrollTop;
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'SCROLL_EVENT',
          scrollY: y
        }));
      }
      
      function initialize() {
        console.log('Initializing WebView for:', window.location.href);
        optimizeForMobile();
        
        if (!checkForContent()) {
          const contentInterval = setInterval(() => {
            if (checkForContent()) {
              clearInterval(contentInterval);
            }
          }, 500);
          
          setTimeout(() => {
            clearInterval(contentInterval);
          }, maxContentCheckAttempts * 500);
        }
        
        setTimeout(() => {
          const title = document.querySelector('h1, .entry-title, .page-title')?.textContent?.trim();
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'PAGE_INFO',
            title: title || 'THE CLIFF NEWS',
            url: window.location.href
          }));
        }, 1000);
      }
      
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 100);
      }, { passive: true });
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
      
      window.addEventListener('load', () => {
        setTimeout(initialize, 500);
      });
      
    })();
    true;
  `,
    []
  );

  // Loading handlers (keep your existing optimized versions)
  const handleLoadStart = useCallback(() => {
    console.log('🚀 Load started for:', currentUrl);
    setLoadStartTime(Date.now());
    setIsLoading(true);
    setHasError(false);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Loading timeout - showing error');
      setHasError(true);
      setIsLoading(false);
    }, 20000);
  }, [currentUrl]);

  const handleLoadEnd = useCallback(() => {
    const loadTime = Date.now() - loadStartTime;
    console.log(`📄 Load end - ${loadTime}ms`);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setTimeout(() => {
      if (isLoading) {
        console.log('📄 Fallback: Hiding loading after load end timeout');
        setIsLoading(false);
      }
    }, 3000);
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
    [scrollY, detectPageType]
  );

  // Enhanced category navigation with better state management
  const handleCategoryPress = useCallback(
    (url: string, title: string) => {
      if (url === currentUrl) {
        console.log('🔄 Same URL clicked, refreshing...');
        webViewRef.current?.reload();
        return;
      }

      console.log('🔗 Navigating to category:', title, 'URL:', url);

      // Get the expected category from URL
      const expectedCategory = getCategoryFromUrl(url);

      // Update state immediately and synchronously
      setCurrentTitle(title);
      setCurrentUrl(url);
      setCurrentCategory(expectedCategory);
      setCategoryUpdateKey((prev) => prev + 1); // Force category header update

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

      console.log('🎯 Category state updated immediately:', {
        url,
        title,
        category: expectedCategory,
      });

      // Force WebView refresh with new key
      setWebViewKey((prev) => prev + 1);
    },
    [currentUrl, getCategoryFromUrl]
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
        const pageInfo = detectPageType(navState.url, navState.title);

        // Update category immediately if it changed
        if (pageInfo.category !== currentCategory) {
          setCurrentCategory(pageInfo.category);
          setCategoryUpdateKey((prev) => prev + 1);
        }
      }
    },
    [currentUrl, detectPageType, currentCategory]
  );

  // Enhanced back press handling
  const handleBackPress = useCallback(() => {
    console.log('🔙 Back pressed, navigation history:', navigationHistory);

    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousUrl = newHistory[newHistory.length - 1];

      console.log('🔙 Going back to:', previousUrl);

      // Get expected category and title
      const newCategory = getCategoryFromUrl(
        previousUrl
      ) as keyof typeof CATEGORY_TITLES;
      const newTitle = CATEGORY_TITLES[newCategory] || 'THE CLIFF NEWS';

      console.log('🎯 Back navigation - setting category to:', newCategory);

      // Update all states immediately and synchronously
      setNavigationHistory(newHistory);
      setCurrentUrl(previousUrl);
      setCurrentCategory(newCategory);
      setCurrentTitle(newTitle);
      setCategoryUpdateKey((prev) => prev + 1); // Force category header update

      console.log('🔄 Back navigation state updated:', {
        url: previousUrl,
        category: newCategory,
        title: newTitle,
      });

      // Force WebView refresh after state is updated
      setWebViewKey((prev) => prev + 1);
    } else {
      if (webViewRef.current) {
        webViewRef.current.goBack();
      } else {
        handleHomePress();
      }
    }
  }, [navigationHistory, getCategoryFromUrl]);

  const handleHomePress = useCallback(() => {
    console.log('🏠 Home pressed');
    setCurrentCategory('home');
    setCurrentTitle('THE CLIFF NEWS');
    setCategoryUpdateKey((prev) => prev + 1);
    handleCategoryPress(HOME_URL, 'THE CLIFF NEWS');
    setNavigationHistory([HOME_URL]);
  }, [handleCategoryPress]);

  // Effects
  useEffect(() => {
    const timer = setTimeout(requestNotificationPermission, 3000);
    return () => clearTimeout(timer);
  }, [requestNotificationPermission]);

  // Ensure category is updated when URL changes
  useEffect(() => {
    console.log('🔗 URL effect triggered:', currentUrl);
    const newCategory = getCategoryFromUrl(currentUrl);
    if (newCategory !== currentCategory) {
      console.log(
        '🎯 URL effect - updating category from',
        currentCategory,
        'to',
        newCategory
      );
      setCurrentCategory(newCategory);
      setCategoryUpdateKey((prev) => prev + 1);
    }
  }, [currentUrl, getCategoryFromUrl, currentCategory]);

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
  const isHome = currentCategory === 'home' && !isArticlePage;
  const isCategoryPage =
    Object.values(CATEGORY_MAPPING).includes(currentCategory) && !isArticlePage;
  const shouldShowCategoryHeader = isHome || isCategoryPage;
  const shouldShowBackButton =
    !isHome && (navigationHistory.length > 1 || isArticlePage);
  const shouldShowHomeButton = !isHome;

  console.log('🎯 Render state:', {
    isHome,
    isCategoryPage,
    isArticlePage,
    shouldShowCategoryHeader,
    shouldShowBackButton,
    currentUrl,
    currentCategory,
    categoryUpdateKey,
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

      {/* Category header with force update key */}
      {shouldShowCategoryHeader && (
        <CategoryNavigationHeader
          key={`category-nav-${currentCategory}-${categoryUpdateKey}`}
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
            key={`webview-${webViewKey}`}
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
            pullToRefreshEnabled={true}
            applicationNameForUserAgent="TheCliffNewsApp/1.0"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            cacheEnabled={false}
            allowsBackForwardNavigationGestures={true}
            allowsLinkPreview={false}
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
