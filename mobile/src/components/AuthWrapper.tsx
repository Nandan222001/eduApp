import React, { useEffect, useState, useCallback } from 'react';
import { View, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { sessionService, biometricService } from '@services';
import { deviceFingerprintService } from '@utils/deviceFingerprint';
import { mobileAuthApi } from '@api/mobileAuth';
import { SessionLockScreen } from '@screens/common/SessionLockScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, requireAuth = true }) => {
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (requireAuth) {
      initializeAuth();
    } else {
      setIsInitialized(true);
    }

    return () => {
      sessionService.destroy();
    };
  }, [requireAuth]);

  const initializeAuth = async () => {
    try {
      await sessionService.initialize(handleSessionTimeout, handleSessionLock);

      const locked = await sessionService.isSessionLocked();
      setIsLocked(locked);

      await registerDevice();

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsInitialized(true);
    }
  };

  const registerDevice = async () => {
    try {
      const deviceInfo = await deviceFingerprintService.getDeviceInfo();

      await mobileAuthApi.registerDevice({
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        device_fingerprint: deviceInfo.fingerprint,
        device_model: deviceInfo.deviceModel || undefined,
        os_version: deviceInfo.osVersion,
        app_version: deviceInfo.appVersion,
      });
    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  const handleSessionTimeout = useCallback(() => {
    router.replace('/(auth)/login' as any);
  }, [router]);

  const handleSessionLock = useCallback(() => {
    setIsLocked(true);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  if (!isInitialized) {
    return <View style={{ flex: 1 }} />;
  }

  if (isLocked && requireAuth) {
    return <SessionLockScreen onUnlock={handleUnlock} />;
  }

  return <>{children}</>;
};
