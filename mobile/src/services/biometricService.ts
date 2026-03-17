import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import { secureStorage } from '@utils/secureStorage';
import { deviceFingerprintService } from '@utils/deviceFingerprint';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: string;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface BiometricCredentials {
  email: string;
  password: string;
}

class BiometricService {
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType = 'Biometric';

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'Iris';
      }

      return {
        isAvailable: hasHardware && isEnrolled,
        biometricType,
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        biometricType: 'None',
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const capabilities = await this.checkBiometricCapabilities();

      if (!capabilities.isAvailable) {
        Alert.alert(
          'Biometric Not Available',
          'Please set up biometric authentication in your device settings.'
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Authenticate with ${capabilities.biometricType}`,
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async saveCredentials(email: string, password: string): Promise<boolean> {
    try {
      const credentials: BiometricCredentials = { email, password };
      await secureStorage.setObject('biometric_credentials', credentials, {
        requireAuthentication: true,
      });
      return true;
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
      return false;
    }
  }

  async getCredentials(): Promise<BiometricCredentials | null> {
    try {
      return await secureStorage.getObject<BiometricCredentials>('biometric_credentials', {
        requireAuthentication: true,
      });
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
      return null;
    }
  }

  async removeCredentials(): Promise<void> {
    try {
      await secureStorage.removeItem('biometric_credentials');
    } catch (error) {
      console.error('Error removing biometric credentials:', error);
    }
  }

  async enableBiometric(email: string, password: string): Promise<boolean> {
    try {
      const authenticated = await this.authenticate('Authenticate to enable biometric login');

      if (!authenticated) {
        return false;
      }

      const saved = await this.saveCredentials(email, password);

      if (!saved) {
        Alert.alert('Error', 'Failed to save credentials');
        return false;
      }

      await secureStorage.setItem('biometric_enabled', 'true');
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await this.removeCredentials();
      await secureStorage.removeItem('biometric_enabled');
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  async authenticateForSensitiveOperation(operationType: string): Promise<boolean> {
    try {
      const capabilities = await this.checkBiometricCapabilities();

      if (!capabilities.isAvailable) {
        return false;
      }

      return await this.authenticate(`Authenticate to ${operationType}`);
    } catch (error) {
      console.error('Error authenticating for sensitive operation:', error);
      return false;
    }
  }
}

export const biometricService = new BiometricService();
