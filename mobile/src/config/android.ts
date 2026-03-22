import { Platform } from 'react-native';

/**
 * Android-specific configuration and utilities
 */

export const androidConfig = {
  // Biometric authentication (Fingerprint)
  biometric: {
    enabled: Platform.OS === 'android',
    promptMessage: 'Authenticate to access EduTrack',
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use PIN',
  },

  // Secure Storage
  secureStore: {
    // On Android, SecureStore uses EncryptedSharedPreferences
    keychainAccessible: 'WHEN_UNLOCKED',
  },

  // Background fetch
  backgroundFetch: {
    minimumInterval: 15 * 60, // 15 minutes in seconds
    stopOnTerminate: false,
  },

  // Notifications
  notifications: {
    sound: true,
    vibrate: true,
    priority: 'high',
  },

  // Deep linking
  deepLinking: {
    scheme: 'edutrack',
    domains: ['edutrack.app'],
  },
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

/**
 * Check if running on Android Emulator
 */
export const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  // This would require expo-device to check Device.isDevice
  // For now, we assume non-emulator
  return false;
};

/**
 * Get Android API version
 */
export const getAndroidAPIVersion = (): number | null => {
  if (Platform.OS !== 'android') return null;
  const version = Platform.Version;
  return typeof version === 'number' ? version : null;
};

/**
 * Check if Android API version is at least the specified version
 */
export const isAndroidAPIAtLeast = (minVersion: number): boolean => {
  const version = getAndroidAPIVersion();
  return version !== null && version >= minVersion;
};
