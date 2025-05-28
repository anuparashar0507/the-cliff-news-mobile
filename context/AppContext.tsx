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
import NetInfo from '@react-native-community/netinfo';

type AppContextType = {
  isOnline: boolean;
  reloadWebViews: () => void;
  reloadTrigger: number;
  requestNotificationPermission: () => void;
  loadUrl: string | null;
  isConnected: boolean; // FIXED: Added missing property
};

const AppContext = createContext<AppContextType>({
  isOnline: true,
  reloadWebViews: () => {},
  reloadTrigger: 0,
  requestNotificationPermission: () => {},
  loadUrl: null,
  isConnected: true, // FIXED: Added missing property
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
    if (Platform.OS !== 'web') {
      initializeOneSignal();
      setupNotificationListeners();
    }

    return () => {
      if (Platform.OS !== 'web') {
        removeNotificationListeners();
      }
    };
  }, []);

  const initializeOneSignal = async () => {
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
        language: 'hindi_english', // Based on your bilingual newspaper
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
    console.log('Notification received in foreground:', event);

    // Extract URL from notification data
    const notificationData = event.notification.additionalData;
    if (notificationData?.url) {
      console.log('Notification contains URL:', notificationData.url);
    }

    // Display the notification even in foreground
    event.notification.display();
  };

  const handleNotificationClick = (event: any) => {
    console.log('Notification clicked:', event);

    const customData = event.notification.additionalData;

    if (customData?.url) {
      console.log('Navigating to URL from notification:', customData.url);
      setLoadUrl(customData.url);
    }

    // Track notification interaction
    OneSignal.User.addTags({
      last_notification_clicked: new Date().toISOString(),
      last_notification_title: event.notification.title || '',
    });
  };

  const setupNotificationListeners = () => {
    console.log('Setting up OneSignal notification listeners');

    OneSignal.Notifications.addEventListener(
      'foregroundWillDisplay',
      handleForegroundNotification
    );

    OneSignal.Notifications.addEventListener('click', handleNotificationClick);
  };

  const removeNotificationListeners = () => {
    console.log('Removing OneSignal notification listeners');

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
        loadUrl,
        isConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
