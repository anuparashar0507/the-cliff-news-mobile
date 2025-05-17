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
      },
      entitlements: {
        'aps-environment': 'development',
        'com.apple.security.application-groups': [
          'group.${ios.bundleIdentifier}.onesignal',
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#FFA500',
      },
      package: 'com.thecliff.news',
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
      [
        'onesignal-expo-plugin',
        {
          mode:
            process.env.APP_ENV === 'production' ? 'production' : 'development',
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
