import { isIOS } from '@config/ios';

/**
 * iOS Platform Initialization
 * 
 * This module handles iOS-specific initialization and setup tasks
 * that need to run when the app starts on iOS devices.
 */

export const initializeIOSPlatform = async (): Promise<void> => {
  if (!isIOS()) {
    return;
  }

  try {
    console.log('[iOS] Initializing iOS-specific features...');

    // Initialize iOS-specific services
    await Promise.all([
      initializeKeychain(),
      initializeBiometrics(),
      initializeBackgroundModes(),
    ]);

    console.log('[iOS] iOS platform initialization complete');
  } catch (error) {
    console.error('[iOS] Failed to initialize iOS platform:', error);
  }
};

/**
 * Initialize iOS Keychain
 * Validates that secure storage is available and working
 */
const initializeKeychain = async (): Promise<void> => {
  try {
    const { secureStorage } = await import('./secureStorage');
    
    // Test keychain access
    const testKey = '__ios_keychain_test__';
    await secureStorage.setItem(testKey, 'test');
    const value = await secureStorage.getItem(testKey);
    await secureStorage.removeItem(testKey);
    
    if (value !== 'test') {
      throw new Error('Keychain test failed');
    }
    
    console.log('[iOS] Keychain initialized successfully');
  } catch (error) {
    console.warn('[iOS] Keychain initialization warning:', error);
  }
};

/**
 * Initialize iOS Biometric Authentication
 * Checks availability and capabilities
 */
const initializeBiometrics = async (): Promise<void> => {
  try {
    const { biometricUtils } = await import('./biometric');
    
    const isAvailable = await biometricUtils.isAvailable();
    
    if (isAvailable) {
      const biometricType = await biometricUtils.getBiometricType();
      console.log(`[iOS] ${biometricType} available and ready`);
    } else {
      console.log('[iOS] Biometric authentication not available on this device');
    }
  } catch (error) {
    console.warn('[iOS] Biometric initialization warning:', error);
  }
};

/**
 * Initialize iOS Background Modes
 * Sets up background fetch and other background capabilities
 */
const initializeBackgroundModes = async (): Promise<void> => {
  try {
    const { backgroundSyncService } = await import('./backgroundSync');
    
    // Register background fetch if supported
    await backgroundSyncService.register();
    
    console.log('[iOS] Background modes initialized');
  } catch (error) {
    console.warn('[iOS] Background modes initialization warning:', error);
  }
};

/**
 * Handle iOS-specific deep links
 */
export const handleIOSDeepLink = (url: string): void => {
  if (!isIOS()) {
    return;
  }

  console.log('[iOS] Handling deep link:', url);
  
  // Deep link handling will be implemented based on app requirements
  // This is a placeholder for future implementation
};

/**
 * Configure iOS-specific UI elements
 */
export const configureIOSUI = (): void => {
  if (!isIOS()) {
    return;
  }

  // iOS-specific UI configurations
  console.log('[iOS] Configuring iOS UI elements');
  
  // Additional iOS UI configuration can be added here
};

/**
 * Check iOS version and warn about compatibility
 */
export const checkIOSCompatibility = async (): Promise<boolean> => {
  if (!isIOS()) {
    return true;
  }

  const { getIOSVersion } = await import('@config/ios');
  const version = getIOSVersion();
  
  if (version === null) {
    console.warn('[iOS] Could not determine iOS version');
    return true;
  }

  // Minimum iOS version is 13.4 (set in app.config.js)
  if (version < 13) {
    console.error('[iOS] iOS version', version, 'is not supported. Minimum version is 13.4');
    return false;
  }

  console.log('[iOS] Running on iOS', version);
  return true;
};
