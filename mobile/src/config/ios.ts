import { Platform } from 'react-native';

/**
 * iOS-specific configuration and utilities
 */

export const iosConfig = {
  // Face ID / Touch ID
  biometric: {
    enabled: Platform.OS === 'ios',
    promptMessage: 'Authenticate to access EduTrack',
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use Passcode',
  },

  // Secure Storage
  secureStore: {
    // On iOS, SecureStore uses Keychain
    keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },

  // Background fetch
  backgroundFetch: {
    minimumInterval: 15 * 60, // 15 minutes in seconds
    stopOnTerminate: false,
  },

  // Notifications
  notifications: {
    sound: true,
    badge: true,
    alert: true,
  },

  // Deep linking
  deepLinking: {
    scheme: 'edutrack',
    domains: ['edutrack.app'],
  },
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Check if running on iOS Simulator
 */
export const isIOSSimulator = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  // In real devices, this would check Device.isDevice from expo-device
  // For now, we assume non-simulator
  return false;
};

/**
 * Get iOS version
 */
export const getIOSVersion = (): number | null => {
  if (Platform.OS !== 'ios') return null;
  const version = Platform.Version;
  if (typeof version === 'string') {
    return parseInt(version.split('.')[0], 10);
  }
  return version;
};

/**
 * Check if iOS version is at least the specified version
 */
export const isIOSVersionAtLeast = (minVersion: number): boolean => {
  const version = getIOSVersion();
  return version !== null && version >= minVersion;
};
