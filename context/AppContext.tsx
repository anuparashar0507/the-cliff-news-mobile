import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Platform, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

// FIXED: Proper Expo Go detection and OneSignal handling
const isExpoGo = Constants.appOwnership === 'expo';

let OneSignal: any = null;
let LogLevel: any = null;

// Only import OneSignal in development builds, not in Expo Go
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const onesignalModule = require('react-native-onesignal');
    OneSignal = onesignalModule.OneSignal;
    LogLevel = onesignalModule.LogLevel;
    console.log('OneSignal module loaded successfully');
  } catch (error: any) {
    console.log(
      'OneSignal module not available (expected in Expo Go):',
      error.message
    );
  }
}

type AppContextType = {
  isOnline: boolean;
  reloadWebViews: () => void;
  reloadTrigger: number;
  requestNotificationPermission: () => void;
  loadUrl: string | null;
  isConnected: boolean;
  isExpoGo: boolean; // Added for debugging
};

const AppContext = createContext<AppContextType>({
  isOnline: true,
  reloadWebViews: () => {},
  reloadTrigger: 0,
  requestNotificationPermission: () => {},
  loadUrl: null,
  isConnected: true,
  isExpoGo: false,
});

export const useAppContext = () => useContext(AppContext);

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [loadUrl, setLoadUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log(`Running in: ${isExpoGo ? 'Expo Go' : 'Development Build'}`);
    console.log(`OneSignal available: ${!!OneSignal}`);
  }, []);

  useEffect(() => {
    // Enhanced network connectivity monitoring
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOnline(connected);
      console.log('Network state changed:', connected);
    });

    // Initial network state check
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOnline(connected);
    });

    return () => unsubscribe();
  }, []);

  const reloadWebViews = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'web') return;

    if (isExpoGo) {
      console.log('Notification permission request skipped in Expo Go');
      Alert.alert(
        'Development Mode',
        'Push notifications are only available in the production app. This feature will work when you install the app from the App Store.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!OneSignal) {
      console.log('OneSignal not available');
      return;
    }

    try {
      const hasPermission = await OneSignal.Notifications.hasPermission;

      if (!hasPermission) {
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
              onPress: async () => {
                try {
                  await OneSignal.Notifications.requestPermission(true);
                  console.log('Notification permission granted');
                } catch (error) {
                  console.error('Error requesting permission:', error);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    if (!isExpoGo && Platform.OS !== 'web' && OneSignal) {
      initializeOneSignal();
      setupNotificationListeners();
    } else {
      console.log(
        'Skipping OneSignal setup - not available in current environment'
      );
    }

    return () => {
      if (!isExpoGo && Platform.OS !== 'web' && OneSignal) {
        removeNotificationListeners();
      }
    };
  }, []);

  const initializeOneSignal = async () => {
    if (!OneSignal || !LogLevel) {
      console.log('OneSignal not available, skipping initialization');
      return;
    }

    try {
      console.log('Initializing OneSignal...');

      // Set log level for debugging (remove in production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId || '';

      if (!oneSignalAppId) {
        console.error('OneSignal App ID is not configured correctly');
        return;
      }

      console.log('OneSignal App ID:', oneSignalAppId);

      // Initialize OneSignal
      OneSignal.initialize(oneSignalAppId);

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Login with device ID
      const deviceId = Constants.installationId || `device_${Date.now()}`;
      await OneSignal.login(deviceId);
      console.log('OneSignal login successful with device ID:', deviceId);

      // Add user tags for better targeting
      await OneSignal.User.addTags({
        app_platform: Platform.OS,
        app_version: Constants.expoConfig?.version || '1.0.0',
        device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
        install_date: new Date().toISOString().split('T')[0],
        user_type: 'mobile_app_user',
        language: 'hindi_english',
        build_type: 'development',
      });

      console.log('OneSignal initialization completed successfully');

      // Test notification permission status
      const hasPermission = await OneSignal.Notifications.hasPermission;
      console.log('Current notification permission:', hasPermission);
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  };

  const handleForegroundNotification = (event: any) => {
    if (!OneSignal) return;

    console.log('Notification received in foreground:', event);

    // Extract URL from notification data
    const notificationData = event.notification.additionalData;
    if (notificationData?.url) {
      console.log('Notification contains URL:', notificationData.url);
      setLoadUrl(notificationData.url);
    }

    // Display the notification even in foreground
    try {
      event.notification.display();
    } catch (error) {
      console.log('Error displaying notification:', error);
    }
  };

  const handleNotificationClick = (event: any) => {
    if (!OneSignal) return;

    console.log('Notification clicked:', event);

    const customData = event.notification.additionalData;

    if (customData?.url) {
      console.log('Navigating to URL from notification:', customData.url);
      setLoadUrl(customData.url);
    }

    // Track notification interaction
    try {
      OneSignal.User.addTags({
        last_notification_clicked: new Date().toISOString(),
        last_notification_title: event.notification.title || '',
      });
    } catch (error) {
      console.log('Error tracking notification interaction:', error);
    }
  };

  const setupNotificationListeners = () => {
    if (!OneSignal) return;

    console.log('Setting up OneSignal notification listeners');

    try {
      OneSignal.Notifications.addEventListener(
        'foregroundWillDisplay',
        handleForegroundNotification
      );

      OneSignal.Notifications.addEventListener(
        'click',
        handleNotificationClick
      );
    } catch (error) {
      console.log('Error setting up notification listeners:', error);
    }
  };

  const removeNotificationListeners = () => {
    if (!OneSignal) return;

    console.log('Removing OneSignal notification listeners');

    try {
      OneSignal.Notifications.removeEventListener(
        'foregroundWillDisplay',
        handleForegroundNotification
      );

      OneSignal.Notifications.removeEventListener(
        'click',
        handleNotificationClick
      );
    } catch (error) {
      console.log('Error removing notification listeners:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        reloadWebViews,
        reloadTrigger,
        requestNotificationPermission,
        loadUrl,
        isConnected,
        isExpoGo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
