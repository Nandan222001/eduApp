import { Platform } from 'react-native';
import { iosConfig } from '@config/ios';

// Lazy load LocalAuthentication only on native platforms
let LocalAuthentication: any = null;
if (Platform.OS !== 'web') {
  LocalAuthentication = require('expo-local-authentication');
}

export const biometricUtils = {
  isAvailable: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  getSupportedTypes: async (): Promise<any[]> => {
    if (Platform.OS === 'web') {
      return [];
    }
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  authenticate: async (options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Biometric authentication is not available on web',
      };
    }

    try {
      // Use iOS-specific config as defaults
      const config = Platform.OS === 'ios' ? iosConfig.biometric : {};
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || config.promptMessage || 'Authenticate to continue',
        cancelLabel: options?.cancelLabel || config.cancelLabel || 'Cancel',
        disableDeviceFallback: options?.disableDeviceFallback || false,
        fallbackLabel: config.fallbackLabel || 'Use Passcode',
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
    }
  },

  getBiometricType: async (): Promise<string> => {
    if (Platform.OS === 'web') {
      return 'Not Available';
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }

    return 'Biometric';
  },
};
