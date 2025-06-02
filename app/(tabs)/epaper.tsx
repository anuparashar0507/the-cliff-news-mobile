import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { StyleSheet, View, Platform, Alert } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import { COLORS } from '@/constants/Theme';
import WebViewError from '@/components/WebViewError';
import WebViewLoading from '@/components/WebViewLoading';
import MobileAppHeader from '@/components/MobileAppHeader';

const EPAPER_URL = 'https://thecliffnews.in/index.php/elementor-12046/';

export default function EPaperScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(EPAPER_URL);
  const [webViewKey, setWebViewKey] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [lastError, setLastError] = useState<string>('');

  const webViewRef = useRef<WebView>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  // Monitor network connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('📶 E-Paper network state:', state.isConnected);
      setIsConnected(state.isConnected ?? false);

      // Auto-retry if connection is restored and we had an error
      if (state.isConnected && hasError && retryCount < 3) {
        console.log('📶 Connection restored, auto-retrying E-Paper...');
        setTimeout(() => {
          handleReload();
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, [hasError, retryCount]);

  // Enhanced injected JavaScript for E-Paper optimization with network resilience
  const injectedJavaScript = useMemo(
    () => `
    (function() {
      let contentCheckAttempts = 0;
      let networkRetryAttempts = 0;
      const maxContentCheckAttempts = 25; // Increased for E-Paper
      const maxNetworkRetryAttempts = 3;
      
      console.log('E-Paper WebView script initialized for:', window.location.href);
      
      // Network detection
      function checkNetworkConnection() {
        return navigator.onLine;
      }
      
      // E-Paper specific optimizations with error resilience
      function optimizeEPaper() {
        try {
          // Hide navigation and header elements
          const hideSelectors = [
            'header.site-header', '#masthead', '.main-header',
            '#wpadminbar', '.top-header', '#site-navigation',
            '.main-navigation', '.site-branding', '.menu-toggle',
            '.ticker-item-wrap', '.top-ticker-news', '.breadcrumb',
            '.entry-meta', '.post-navigation', '.comments-area',
            '.sidebar', '.widget-area', '.footer-widget-area',
            '.site-footer', 'footer', '.social-links',
            '.related-posts', '.post-tags', '.author-bio',
            '.wp-block-navigation', '.has-header-video'
          ];
          
          hideSelectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el) {
                  el.style.display = 'none';
                  el.style.visibility = 'hidden';
                  el.style.height = '0';
                  el.style.overflow = 'hidden';
                }
              });
            } catch (e) {
              console.log('Error hiding selector:', selector, e);
            }
          });
          
          // Add E-Paper specific mobile styles with error handling
          if (!document.getElementById('epaper-mobile-styles')) {
            try {
              const style = document.createElement('style');
              style.id = 'epaper-mobile-styles';
              style.textContent = \`
                body {
                  padding-top: 0 !important;
                  margin-top: 0 !important;
                  font-size: 16px !important;
                  line-height: 1.4 !important;
                  background-color: #f8f9fa !important;
                  overflow-x: hidden !important;
                }
                
                .site-content, .elementor-section, .elementor-container {
                  padding-top: 0 !important;
                  margin-top: 0 !important;
                  max-width: 100% !important;
                }
                
                /* E-Paper specific optimizations */
                .elementor-widget-wp-widget-media_image img,
                .elementor-image img,
                .wp-caption img,
                .elementor-widget-image img {
                  max-width: 100% !important;
                  width: 100% !important;
                  height: auto !important;
                  border-radius: 8px !important;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                  object-fit: contain !important;
                }
                
                /* Optimize PDF viewer if present */
                embed, object, iframe[src*=".pdf"] {
                  width: 100% !important;
                  min-height: 80vh !important;
                  max-height: 100vh !important;
                  border: none !important;
                  border-radius: 8px !important;
                  background: white !important;
                }
                
                /* Hide unnecessary elements for E-Paper */
                .elementor-widget-divider,
                .elementor-widget-spacer,
                .entry-header,
                .entry-footer,
                .post-meta,
                .post-date,
                .author-info,
                .social-share {
                  display: none !important;
                }
                
                /* Improve readability */
                p, .elementor-text-editor {
                  font-size: 16px !important;
                  line-height: 1.6 !important;
                  margin-bottom: 15px !important;
                  color: #333 !important;
                }
                
                h1, h2, h3, h4, h5, h6 {
                  color: #1a1a1a !important;
                  margin-bottom: 10px !important;
                  font-weight: 600 !important;
                  line-height: 1.3 !important;
                }
                
                /* Loading states */
                .elementor-loading,
                .loading,
                .spinner {
                  display: none !important;
                }
                
                /* Ensure content is visible */
                .elementor-section {
                  min-height: auto !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                
                /* Optimize for mobile touch */
                a, button {
                  min-height: 44px !important;
                  padding: 8px !important;
                  touch-action: manipulation !important;
                }
                
                /* Fix common layout issues */
                .elementor-container {
                  width: 100% !important;
                  max-width: 100% !important;
                  padding-left: 10px !important;
                  padding-right: 10px !important;
                }
                
                /* Responsive images */
                .wp-block-image img,
                .elementor-image-box-img img {
                  width: 100% !important;
                  height: auto !important;
                  max-width: 100% !important;
                }
                
                /* Error recovery styles */
                .error, .error-message, .loading-error {
                  display: none !important;
                }
              \`;
              document.head.appendChild(style);
              console.log('E-Paper styles applied successfully');
            } catch (e) {
              console.log('Error applying E-Paper styles:', e);
            }
          }
        } catch (e) {
          console.log('E-Paper optimization error:', e);
        }
      }
      
      // Enhanced content detection for E-Paper with retry logic
      function checkForEPaperContent() {
        try {
          contentCheckAttempts++;
          
          // Check network first
          if (!checkNetworkConnection()) {
            console.log('No network connection detected');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'NETWORK_ERROR',
              message: 'No network connection'
            }));
            return false;
          }
          
          // Look for E-Paper specific content indicators
          const epaperSelectors = [
            '.elementor-section',
            '.elementor-container', 
            '.elementor-widget',
            '.wp-caption',
            'embed[src*=".pdf"]',
            'object[data*=".pdf"]',
            'iframe[src*=".pdf"]',
            '.elementor-image',
            '.elementor-widget-image img',
            '.elementor-widget-wp-widget-media_image',
            '.wp-block-image',
            '.wp-block-media-text',
            '[class*="elementor"]'
          ];
          
          let hasContent = false;
          let contentElement = null;
          let contentType = 'unknown';
          
          // Check for Elementor content
          for (const selector of epaperSelectors) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                // Check if elements have actual content
                for (const element of elements) {
                  if (element.offsetHeight > 0 || element.offsetWidth > 0 || 
                      element.textContent.trim().length > 0 ||
                      element.querySelector('img, embed, object, iframe')) {
                    hasContent = true;
                    contentElement = element;
                    contentType = selector;
                    console.log('Found E-Paper content with selector:', selector);
                    break;
                  }
                }
                if (hasContent) break;
              }
            } catch (e) {
              console.log('Error checking selector:', selector, e);
            }
          }
          
          // Additional checks for E-Paper content
          if (!hasContent) {
            try {
              // Check for PDF embeds
              const pdfElements = document.querySelectorAll('embed, object, iframe');
              for (const element of pdfElements) {
                const src = element.getAttribute('src') || element.getAttribute('data');
                if (src && (src.includes('.pdf') || src.includes('pdf') || src.includes('elementor'))) {
                  hasContent = true;
                  contentType = 'pdf';
                  console.log('Found PDF content');
                  break;
                }
              }
            } catch (e) {
              console.log('Error checking PDF content:', e);
            }
          }
          
          if (!hasContent) {
            try {
              // Check for images that might be the E-Paper
              const images = document.querySelectorAll('img');
              const relevantImages = Array.from(images).filter(img => {
                const src = img.src || '';
                const alt = img.alt || '';
                const className = img.className || '';
                return (src.length > 50 && img.offsetHeight > 100) || 
                       alt.toLowerCase().includes('paper') || 
                       alt.toLowerCase().includes('news') ||
                       className.includes('elementor');
              });
              if (relevantImages.length > 0) {
                hasContent = true;
                contentType = 'image';
                console.log('Found E-Paper images:', relevantImages.length);
              }
            } catch (e) {
              console.log('Error checking images:', e);
            }
          }
          
          if (!hasContent) {
            try {
              // Check for general content
              const bodyText = document.body.textContent.trim();
              const bodyHeight = document.body.offsetHeight;
              hasContent = bodyText.length > 500 && 
                          bodyHeight > 200 && 
                          !bodyText.toLowerCase().includes('loading') &&
                          !bodyText.toLowerCase().includes('error');
              if (hasContent) {
                contentType = 'text';
                console.log('Found general E-Paper content');
              }
            } catch (e) {
              console.log('Error checking general content:', e);
            }
          }
          
          console.log('E-Paper content check attempt', contentCheckAttempts, 'hasContent:', hasContent, 'type:', contentType);
          
          if (hasContent) {
            console.log('E-Paper content detected! Notifying React Native...');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'EPAPER_CONTENT_READY',
              url: window.location.href,
              contentFound: true,
              contentType: contentType,
              attempts: contentCheckAttempts
            }));
            return true;
          } else if (contentCheckAttempts >= maxContentCheckAttempts) {
            console.log('Max E-Paper content check attempts reached, forcing content ready');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'EPAPER_CONTENT_READY',
              url: window.location.href,
              contentFound: false,
              forced: true,
              attempts: contentCheckAttempts
            }));
            return true;
          }
          
          return false;
        } catch (e) {
          console.log('E-Paper content check error:', e);
          return false;
        }
      }
      
      // Initialize E-Paper optimizations with retry logic
      function initializeEPaper() {
        console.log('Initializing E-Paper optimizations for:', window.location.href);
        
        try {
          optimizeEPaper();
          
          // Start content checking
          if (!checkForEPaperContent()) {
            // Check periodically with exponential backoff
            let interval = 500;
            const contentInterval = setInterval(() => {
              if (checkForEPaperContent()) {
                clearInterval(contentInterval);
              } else {
                // Increase interval slightly to reduce CPU usage
                interval = Math.min(interval * 1.1, 2000);
              }
            }, interval);
            
            // Stop after max attempts
            setTimeout(() => {
              clearInterval(contentInterval);
            }, maxContentCheckAttempts * 500);
          }
          
          // Additional optimization after a delay
          setTimeout(() => {
            optimizeEPaper();
            
            // Send page ready signal if not already sent
            if (contentCheckAttempts === 0) {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'EPAPER_CONTENT_READY',
                url: window.location.href,
                contentFound: true,
                fallback: true
              }));
            }
          }, 3000);
        } catch (e) {
          console.log('E-Paper initialization error:', e);
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'EPAPER_ERROR',
            error: e.message || 'Unknown initialization error'
          }));
        }
      }
      
      // Network retry logic
      function retryWithBackoff() {
        if (networkRetryAttempts < maxNetworkRetryAttempts) {
          networkRetryAttempts++;
          const delay = networkRetryAttempts * 2000; // 2s, 4s, 6s
          console.log(\`Retrying E-Paper load in \${delay}ms (attempt \${networkRetryAttempts})\`);
          
          setTimeout(() => {
            window.location.reload();
          }, delay);
        }
      }
      
      // Error handling
      window.addEventListener('error', (e) => {
        console.log('E-Paper JavaScript error:', e);
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'EPAPER_ERROR',
          error: e.message || 'JavaScript error occurred'
        }));
      });
      
      // Initialize when ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEPaper);
      } else {
        initializeEPaper();
      }
      
      // Also try on window load
      window.addEventListener('load', () => {
        setTimeout(() => {
          optimizeEPaper();
          initializeEPaper();
        }, 1000);
      });
      
      // Continuous optimization for dynamic content (less frequent)
      const optimizationInterval = setInterval(optimizeEPaper, 5000);
      
      // Clean up after 60 seconds
      setTimeout(() => {
        clearInterval(optimizationInterval);
      }, 60000);
      
    })();
    true;
  `,
    []
  );

  // Loading handlers with improved error recovery
  const handleLoadStart = useCallback(() => {
    console.log('🚀 E-Paper load started for:', currentUrl);
    setLoadStartTime(Date.now());
    setIsLoading(true);
    setHasError(false);
    setLastError('');

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Set timeout (30 seconds for E-Paper as it might be larger)
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ E-Paper loading timeout - showing error');
      setLastError('Loading timeout - content took too long to load');
      setHasError(true);
      setIsLoading(false);
    }, 30000);
  }, [currentUrl]);

  const handleLoadEnd = useCallback(() => {
    const loadTime = Date.now() - loadStartTime;
    console.log(`📄 E-Paper load end - ${loadTime}ms`);

    // Clear timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Set a fallback in case content detection fails (longer for E-Paper)
    setTimeout(() => {
      if (isLoading) {
        console.log(
          '📄 E-Paper fallback: Hiding loading after load end timeout'
        );
        setIsLoading(false);
      }
    }, 5000); // 5 second fallback for E-Paper
  }, [loadStartTime, isLoading]);

  const handleError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.warn('❌ E-Paper WebView error:', nativeEvent);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Set specific error message based on error type
      let errorMessage = 'Failed to load E-Paper';
      if (nativeEvent.code === -1005) {
        errorMessage =
          'Network connection lost. Please check your internet connection.';
      } else if (nativeEvent.code === -1003) {
        errorMessage = 'Server not found. Please try again later.';
      } else if (nativeEvent.code === -1001) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (nativeEvent.description) {
        errorMessage = nativeEvent.description;
      }

      setLastError(errorMessage);
      setIsLoading(false);
      setHasError(true);

      // Auto-retry for network errors if retry count is low
      if (
        (nativeEvent.code === -1005 || nativeEvent.code === -1001) &&
        retryCount < 2
      ) {
        console.log('📡 Auto-retrying E-Paper due to network error...');
        setRetryCount((prev) => prev + 1);

        // Clear existing retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        // Retry after delay
        retryTimeoutRef.current = setTimeout(() => {
          handleReload();
        }, 3000 + retryCount * 2000); // Exponential backoff
      }
    },
    [retryCount]
  );

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'EPAPER_CONTENT_READY':
            console.log('🎉 E-Paper content ready!', data);
            setIsLoading(false);
            setRetryCount(0); // Reset retry count on success
            break;

          case 'EPAPER_ERROR':
            console.log('❌ E-Paper JavaScript error:', data);
            setLastError(data.error || 'JavaScript error occurred');
            break;

          case 'NETWORK_ERROR':
            console.log('📡 E-Paper network error:', data);
            if (!isConnected) {
              setLastError('No internet connection available');
              setHasError(true);
              setIsLoading(false);
            }
            break;
        }
      } catch (error) {
        // Ignore invalid JSON
      }
    },
    [isConnected]
  );

  const handleReload = useCallback(() => {
    console.log('🔄 E-Paper manual reload');
    setIsLoading(true);
    setHasError(false);
    setLastError('');
    setWebViewKey((prev) => prev + 1);

    // Clear retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      console.log('🌐 E-Paper navigation state:', navState.url);
      if (navState.url && navState.url !== currentUrl) {
        setCurrentUrl(navState.url);
      }
    },
    [currentUrl]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Show network error if not connected
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <MobileAppHeader
          title="The Cliff E-Paper"
          onRefreshPress={handleReload}
        />
        <WebViewError
          onReload={handleReload}
          message="No internet connection. Please check your network and try again."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileAppHeader
        title="The Cliff E-Paper"
        onRefreshPress={handleReload}
      />

      {hasError ? (
        <WebViewError
          onReload={handleReload}
          message={lastError || 'Failed to load E-Paper. Please try again.'}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            key={`epaper-webview-${webViewKey}`}
            source={{ uri: EPAPER_URL }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={onNavigationStateChange}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleWebViewMessage}
            // Configuration optimized for E-Paper with network resilience
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            pullToRefreshEnabled={true}
            applicationNameForUserAgent="TheCliffNewsApp-EPaper/1.0"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            // Network and performance optimizations
            cacheEnabled={true} // E-Paper can be cached
            allowsBackForwardNavigationGestures={true}
            allowsLinkPreview={false}
            incognito={false}
            // Additional E-Paper specific settings
            scalesPageToFit={true}
            startInLoadingState={false}
            // Network timeout settings
            {...(Platform.OS === 'android' && {
              mixedContentMode: 'compatibility',
              allowFileAccess: true,
              allowFileAccessFromFileURLs: true,
              allowUniversalAccessFromFileURLs: true,
              // Android specific network settings
              setBuiltInZoomControls: false,
              setDisplayZoomControls: false,
            })}
            // iOS specific settings
            {...(Platform.OS === 'ios' && {
              allowsProtectedMedia: false,
              dataDetectorTypes: 'none',
              scrollEnabled: true,
              bounces: true,
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
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
