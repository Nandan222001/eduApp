import { useState } from 'react';
import { Alert } from 'react-native';
import { sessionService } from '@services';
import { mobileAuthApi } from '@api/mobileAuth';
import { deviceFingerprintService } from '@utils/deviceFingerprint';

export const useSensitiveOperation = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const executeWithAuth = async <T,>(
    operationType: string,
    operation: () => Promise<T>,
    options?: {
      operationDetails?: string;
      skipAuth?: boolean;
    }
  ): Promise<T | null> => {
    if (options?.skipAuth) {
      return await operation();
    }

    setIsAuthenticating(true);
    try {
      const authenticated = await sessionService.requireReauthForSensitiveOperation(
        operationType
      );

      if (!authenticated) {
        Alert.alert(
          'Authentication Required',
          `Please authenticate to ${operationType.toLowerCase()}`
        );
        setIsAuthenticating(false);
        return null;
      }

      const result = await operation();

      const deviceInfo = await deviceFingerprintService.getDeviceInfo();
      
      await mobileAuthApi.logSensitiveOperation({
        operation_type: operationType,
        operation_details: options?.operationDetails,
        auth_method: 'biometric',
        auth_success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          device_fingerprint: deviceInfo.fingerprint,
        },
      });

      return result;
    } catch (error) {
      console.error(`Error executing sensitive operation (${operationType}):`, error);
      
      try {
        const deviceInfo = await deviceFingerprintService.getDeviceInfo();
        
        await mobileAuthApi.logSensitiveOperation({
          operation_type: operationType,
          operation_details: options?.operationDetails,
          auth_method: 'biometric',
          auth_success: false,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            device_fingerprint: deviceInfo.fingerprint,
          },
        });
      } catch (logError) {
        console.error('Error logging sensitive operation:', logError);
      }

      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    executeWithAuth,
    isAuthenticating,
  };
};
