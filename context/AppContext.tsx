import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { OneSignal, LogLevel } from 'react-native-onesignal';
// import Constants from 'expo-constants';
type AppContextType = {
  isOnline: boolean;
  reloadWebViews: () => void;
  reloadTrigger: number;
};

const AppContext = createContext<AppContextType>({
  isOnline: true,
  reloadWebViews: () => {},
  reloadTrigger: 0,
});

export const useAppContext = () => useContext(AppContext);

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Effect to monitor network status would go here in a real app
  // For demonstration, we're just assuming online status is true

  const reloadWebViews = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    // This would be where you'd register for push notifications
    if (Platform.OS !== 'web') {
      // Only register for push notifications on native platforms
      // registerForPushNotifications();
      // Enable verbose logging for debugging (remove in production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      const oneSignalId = process.env.ONE_SIGNAL_APP_ID || '';
      // Initialize with your OneSignal App ID
      OneSignal.initialize(oneSignalId);
      // Use this method to prompt for push notifications.
      // We recommend removing this method after testing and instead use In-App Messages to prompt for notification permission.
      OneSignal.Notifications.requestPermission(false);
    }
  }, []);

  return (
    <AppContext.Provider value={{ isOnline, reloadWebViews, reloadTrigger }}>
      {children}
    </AppContext.Provider>
  );
};
