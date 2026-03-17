import 'dotenv/config';

const IS_DEV = process.env.APP_ENV === 'development';
const IS_STAGING = process.env.APP_ENV === 'staging';
const IS_PROD = process.env.APP_ENV === 'production';

// Environment-specific configuration
const getConfig = () => {
  const baseConfig = {
    apiUrl: process.env.API_URL || 'http://localhost:8000',
    sentryDsn: process.env.SENTRY_DSN,
    amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
  };

  if (IS_DEV) {
    return {
      ...baseConfig,
      apiUrl: process.env.API_URL || 'http://localhost:8000',
      enableAnalytics: false,
      enableCrashReporting: false,
    };
  }

  if (IS_STAGING) {
    return {
      ...baseConfig,
      apiUrl: process.env.API_URL || 'https://staging-api.eduplatform.com',
      enableAnalytics: true,
      enableCrashReporting: true,
    };
  }

  if (IS_PROD) {
    return {
      ...baseConfig,
      apiUrl: process.env.API_URL || 'https://api.eduplatform.com',
      enableAnalytics: true,
      enableCrashReporting: true,
    };
  }

  return baseConfig;
};

const appEnv = process.env.APP_ENV || 'development';
const envConfig = getConfig();

export default ({ config }) => ({
  ...config,
  name: IS_PROD ? 'EduPlatform' : IS_STAGING ? 'EduPlatform Staging' : 'EduPlatform Dev',
  slug: 'eduplatform',
  version: process.env.APP_VERSION || '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: IS_PROD ? 'eduplatform' : IS_STAGING ? 'eduplatform-staging' : 'eduplatform-dev',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    enabled: true,
    fallbackToCacheTimeout: 0,
    url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    codeSigningCertificate: './certificates/code-signing.pem',
    codeSigningMetadata: {
      keyid: 'main',
      alg: 'rsa-v1_5-sha256',
    },
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PROD
      ? 'com.yourcompany.eduplatform'
      : IS_STAGING
      ? 'com.yourcompany.eduplatform.staging'
      : 'com.yourcompany.eduplatform.dev',
    buildNumber: process.env.IOS_BUILD_NUMBER || '1',
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to scan documents and take photos.',
      NSPhotoLibraryUsageDescription: 'This app accesses your photo library to upload images.',
      NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication.',
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    googleServicesFile: IS_PROD
      ? './GoogleService-Info-prod.plist'
      : IS_STAGING
      ? './GoogleService-Info-staging.plist'
      : './GoogleService-Info-dev.plist',
    associatedDomains: [`applinks:${IS_PROD ? 'app' : IS_STAGING ? 'staging-app' : 'dev-app'}.eduplatform.com`],
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: IS_PROD
      ? 'com.yourcompany.eduplatform'
      : IS_STAGING
      ? 'com.yourcompany.eduplatform.staging'
      : 'com.yourcompany.eduplatform.dev',
    versionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1', 10),
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'NOTIFICATIONS',
      'VIBRATE',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
    ],
    googleServicesFile: IS_PROD
      ? './google-services-prod.json'
      : IS_STAGING
      ? './google-services-staging.json'
      : './google-services-dev.json',
    useNextNotificationsApi: true,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: `${IS_PROD ? 'app' : IS_STAGING ? 'staging-app' : 'dev-app'}.eduplatform.com`,
            pathPrefix: '/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ffffff',
        sounds: ['./assets/notification-sound.wav'],
        mode: IS_PROD ? 'production' : 'default',
      },
    ],
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        url: 'https://sentry.io/',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: '34.0.0',
          enableProguardInReleaseBuilds: IS_PROD,
          enableShrinkResourcesInReleaseBuilds: IS_PROD,
        },
        ios: {
          deploymentTarget: '13.4',
        },
      },
    ],
  ],
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || '[your-project-id]',
    },
    appEnv,
    ...envConfig,
  },
  notification: {
    icon: './assets/notification-icon.png',
    color: '#ffffff',
    iosDisplayInForeground: true,
    androidMode: 'default',
    androidCollapsedTitle: '#{unread_notifications} new notifications',
  },
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        },
      },
    ],
  },
});
