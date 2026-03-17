import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: string;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export const useBiometric = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    biometricType: '',
    isEnrolled: false,
    supportedTypes: [],
  });

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const checkBiometricCapabilities = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType = '';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'Iris';
      } else {
        biometricType = 'Biometric';
      }

      setCapabilities({
        isAvailable: compatible && enrolled,
        biometricType,
        isEnrolled: enrolled,
        supportedTypes,
      });
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
    }
  };

  const authenticate = async (options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<LocalAuthentication.LocalAuthenticationResult> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || 'Authenticate to continue',
        cancelLabel: options?.cancelLabel || 'Cancel',
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
        fallbackLabel: 'Use Passcode',
      });

      return result;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'authenticator_unavailable',
      };
    }
  };

  return {
    capabilities,
    authenticate,
    checkBiometricCapabilities,
  };
};
