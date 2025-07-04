module.exports = {
  expo: {
    name: 'The Cliff News',
    slug: 'the-cliff-news',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'thecliffnews',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.thecliff.news',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            'thecliffnews.in': {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: '1.0',
              NSIncludesSubdomains: true,
            },
          },
        },
        NSPhotoLibraryUsageDescription:
          'This app needs access to your photo library so you can select photos if a feature within our web content requires it (e.g., for ad booking forms or other interactions).',
        NSCameraUsageDescription:
          'This app needs access to your camera if you choose to capture photos or videos for features within our web content (e.g., for ad booking forms or other interactions).',
        NSLocationWhenInUseUsageDescription:
          'This app can use your location to provide location-based news or enhance your experience with relevant local content, if you choose to share it.',
      },
      entitlements: {
        'aps-environment':
          process.env.APP_ENV === 'production' ? 'production' : 'development',
        'com.apple.security.application-groups': [
          'group.com.thecliff.news.onesignal',
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#FFA500',
      },
      package: 'com.thecliffnews',
      versionCode: 1,
      permissions: [
        'INTERNET',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        'WAKE_LOCK',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-splash-screen',
      '@config-plugins/react-native-blob-util',
      '@config-plugins/react-native-pdf',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
          },
        },
      ],
      [
        'onesignal-expo-plugin',
        {
          mode:
            process.env.APP_ENV === 'production' ? 'production' : 'development',
          devTeam: 'D9752925GN',
          iPhoneDeploymentTarget: '15.1',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      oneSignalAppId: 'e8b5ab57-f86a-4d44-83c9-25fee9ffdc06',
      eas: {
        projectId: '6bb6c65c-2f07-4ebf-8351-abad227c8250',
      },
    },
  },
};
