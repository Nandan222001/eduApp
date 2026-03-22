import { isAndroid } from '@config/android';

/**
 * Android Platform Initialization
 * 
 * This module handles Android-specific initialization and setup tasks
 * that need to run when the app starts on Android devices.
 */

export const initializeAndroidPlatform = async (): Promise<void> => {
  if (!isAndroid()) {
    return;
  }

  try {
    console.log('[Android] Initializing Android-specific features...');

    // Initialize Android-specific services
    await Promise.all([
      initializeSecureStorage(),
      initializeBiometrics(),
      initializeBackgroundModes(),
    ]);

    console.log('[Android] Android platform initialization complete');
  } catch (error) {
    console.error('[Android] Failed to initialize Android platform:', error);
  }
};

/**
 * Initialize Android Secure Storage
 * Validates that EncryptedSharedPreferences is available and working
 */
const initializeSecureStorage = async (): Promise<void> => {
  try {
    const { secureStorage } = await import('./secureStorage');
    
    // Test secure storage access
    const testKey = '__android_secure_storage_test__';
    await secureStorage.setItem(testKey, 'test');
    const value = await secureStorage.getItem(testKey);
    await secureStorage.removeItem(testKey);
    
    if (value !== 'test') {
      throw new Error('Secure storage test failed');
    }
    
    console.log('[Android] Secure storage initialized successfully');
  } catch (error) {
    console.warn('[Android] Secure storage initialization warning:', error);
  }
};

/**
 * Initialize Android Biometric Authentication
 * Checks availability and capabilities (Fingerprint, Face, etc.)
 */
const initializeBiometrics = async (): Promise<void> => {
  try {
    const { biometricUtils } = await import('./biometric');
    
    const isAvailable = await biometricUtils.isAvailable();
    
    if (isAvailable) {
      const biometricType = await biometricUtils.getBiometricType();
      console.log(`[Android] ${biometricType} available and ready`);
    } else {
      console.log('[Android] Biometric authentication not available on this device');
    }
  } catch (error) {
    console.warn('[Android] Biometric initialization warning:', error);
  }
};

/**
 * Initialize Android Background Modes
 * Sets up background fetch and other background capabilities
 */
const initializeBackgroundModes = async (): Promise<void> => {
  try {
    const { backgroundSyncService } = await import('./backgroundSync');
    
    // Register background fetch if supported
    await backgroundSyncService.register();
    
    console.log('[Android] Background modes initialized');
  } catch (error) {
    console.warn('[Android] Background modes initialization warning:', error);
  }
};

/**
 * Handle Android-specific deep links
 */
export const handleAndroidDeepLink = (url: string): void => {
  if (!isAndroid()) {
    return;
  }

  console.log('[Android] Handling deep link:', url);
  
  // Deep link handling will be implemented based on app requirements
  // This is a placeholder for future implementation
};

/**
 * Configure Android-specific UI elements
 */
export const configureAndroidUI = (): void => {
  if (!isAndroid()) {
    return;
  }

  // Android-specific UI configurations
  console.log('[Android] Configuring Android UI elements');
  
  // Additional Android UI configuration can be added here
};

/**
 * Check Android API version and warn about compatibility
 */
export const checkAndroidCompatibility = async (): Promise<boolean> => {
  if (!isAndroid()) {
    return true;
  }

  const { getAndroidAPIVersion } = await import('@config/android');
  const apiLevel = getAndroidAPIVersion();
  
  if (apiLevel === null) {
    console.warn('[Android] Could not determine Android API level');
    return true;
  }

  // Minimum Android API level is 21 (Android 5.0 Lollipop)
  if (apiLevel < 21) {
    console.error('[Android] Android API level', apiLevel, 'is not supported. Minimum level is 21');
    return false;
  }

  console.log('[Android] Running on Android API level', apiLevel);
  return true;
};
