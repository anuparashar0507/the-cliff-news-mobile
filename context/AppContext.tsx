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

// PRODUCTION-SAFE OneSignal handling
const isExpoGo = Constants.appOwnership === 'expo';

let OneSignal: any = null;
let LogLevel: any = null;

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
  isExpoGo: boolean;
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
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOnline(connected);
      console.log('Network state changed:', connected);
    });

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

  // FIXED: Better OneSignal initialization
  useEffect(() => {
    if (!isExpoGo && Platform.OS !== 'web' && OneSignal) {
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

  const handleForegroundNotification = (event: any) => {
    if (!OneSignal) return;

    console.log('Notification received in foreground:', event);

    const notificationData = event.notification.additionalData;
    if (notificationData?.url) {
      console.log('Notification contains URL:', notificationData.url);
      setLoadUrl(notificationData.url);
    }

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
