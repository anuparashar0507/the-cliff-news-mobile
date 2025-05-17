import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Platform, Alert } from 'react-native';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import Constants from 'expo-constants';

type AppContextType = {
  isOnline: boolean;
  reloadWebViews: () => void;
  reloadTrigger: number;
  requestNotificationPermission: () => void;
  loadUrl: string | null;
};

const AppContext = createContext<AppContextType>({
  isOnline: true,
  reloadWebViews: () => {},
  reloadTrigger: 0,
  requestNotificationPermission: () => {},
  loadUrl: null,
});

export const useAppContext = () => useContext(AppContext);

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isOneSignalInitialized, setIsOneSignalInitialized] = useState(false);

  const reloadWebViews = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  // Request notification permission explicitly
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'web') return;

    try {
      // Check current permission status
      const hasPermission = await OneSignal.Notifications.hasPermission;

      if (!hasPermission) {
        // Show the prompt dialog to explain why notifications are useful
        Alert.alert(
          'Stay Updated',
          'Enable notifications to get the latest news and updates from The Cliff News.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: () => OneSignal.Notifications.requestPermission(true),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    // Only initialize OneSignal on native platforms, not on web
    if (Platform.OS !== 'web') {
      initializeOneSignal();
      setupNotificationListeners();
    }

    // Clean up listeners when component unmounts
    return () => {
      if (Platform.OS !== 'web') {
        removeNotificationListeners();
      }
    };
  }, []);

  const initializeOneSignal = () => {
    try {
      // Enable verbose logging for debugging (remove in production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      // Get the OneSignal App ID from Expo constants
      const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId || '';

      if (!oneSignalAppId) {
        console.error('OneSignal App ID is not configured correctly');
        return;
      }

      console.log('Initializing OneSignal with App ID:', oneSignalAppId);

      // Initialize OneSignal
      OneSignal.initialize(oneSignalAppId);

      // Set app ID as external ID
      // Since we don't have user authentication, using a device ID as the external ID
      const deviceId = Constants.installationId || `device_${Date.now()}`;
      OneSignal.login(deviceId);

      // Add device info tags for segmentation
      OneSignal.User.addTags({
        app_platform: Platform.OS,
        app_version: Constants.expoConfig?.version || '1.0.0',
        device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
        install_date: new Date().toISOString().split('T')[0],
      });

      // Mark as initialized
      setIsOneSignalInitialized(true);
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  };

  // Define handler functions outside so we can reference them in removeEventListener
  const handleForegroundNotification = (event: any) => {
    console.log('Notification received in foreground:', event);
    // Display the notification
    event.notification.display();
  };

  const handleNotificationClick = (event: any) => {
    console.log('Notification clicked:', event);

    // Get any custom data from the notification
    const customData = event.notification.additionalData;

    // Handle deep links or specific actions based on notification data
    if (customData?.url) {
      // Navigate to the specific URL in your WebView
      // You'll need to implement a way to communicate this to your WebView components
      // For example, using a global state or navigation parameter
      console.log('Should navigate to URL:', customData.url);

      // Example: You can update a global state or trigger navigation
      setLoadUrl(customData.url);
    }
  };

  // For handling deep links from notifications
  const [loadUrl, setLoadUrl] = useState(null);

  const setupNotificationListeners = () => {
    // Add event listeners using our named handler functions
    OneSignal.Notifications.addEventListener(
      'foregroundWillDisplay',
      handleForegroundNotification
    );
    OneSignal.Notifications.addEventListener('click', handleNotificationClick);
  };

  const removeNotificationListeners = () => {
    // Remove event listeners using the same named handler functions
    OneSignal.Notifications.removeEventListener(
      'foregroundWillDisplay',
      handleForegroundNotification
    );
    OneSignal.Notifications.removeEventListener(
      'click',
      handleNotificationClick
    );
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        reloadWebViews,
        reloadTrigger,
        requestNotificationPermission,
        loadUrl, // Make available to consumers
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
