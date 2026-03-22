/**
 * iOS Integration Tests
 * 
 * These tests verify that iOS-specific features are properly configured
 * and integrated into the application.
 */

import { Platform } from 'react-native';

// Mock Platform for testing
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: 15,
  select: (obj: any) => obj.ios,
}));

describe('iOS Platform Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Path Aliases', () => {
    it('should resolve @store alias', () => {
      expect(() => require('@store')).not.toThrow();
    });

    it('should resolve @components alias', () => {
      expect(() => require('@components/Loading')).not.toThrow();
    });

    it('should resolve @utils alias', () => {
      expect(() => require('@utils/secureStorage')).not.toThrow();
    });

    it('should resolve @config alias', () => {
      expect(() => require('@config/ios')).not.toThrow();
    });

    it('should resolve @constants alias', () => {
      expect(() => require('@constants')).not.toThrow();
    });
  });

  describe('Secure Storage', () => {
    it('should export secureStorage module', () => {
      const { secureStorage } = require('@utils/secureStorage');
      expect(secureStorage).toBeDefined();
      expect(typeof secureStorage.setAccessToken).toBe('function');
      expect(typeof secureStorage.getAccessToken).toBe('function');
      expect(typeof secureStorage.clearAll).toBe('function');
    });

    it('should have platform-specific implementation', () => {
      const { secureStorage } = require('@utils/secureStorage');
      expect(secureStorage.setItem).toBeDefined();
      expect(secureStorage.getItem).toBeDefined();
      expect(secureStorage.removeItem).toBeDefined();
    });
  });

  describe('Biometric Authentication', () => {
    it('should export biometricUtils module', () => {
      const { biometricUtils } = require('@utils/biometric');
      expect(biometricUtils).toBeDefined();
    });

    it('should have required biometric methods', () => {
      const { biometricUtils } = require('@utils/biometric');
      expect(typeof biometricUtils.isAvailable).toBe('function');
      expect(typeof biometricUtils.authenticate).toBe('function');
      expect(typeof biometricUtils.getBiometricType).toBe('function');
    });
  });

  describe('iOS Configuration', () => {
    it('should export iOS config', () => {
      const iosConfig = require('@config/ios');
      expect(iosConfig.iosConfig).toBeDefined();
      expect(iosConfig.isIOS).toBeDefined();
    });

    it('should have biometric configuration', () => {
      const { iosConfig } = require('@config/ios');
      expect(iosConfig.biometric).toBeDefined();
      expect(iosConfig.biometric.promptMessage).toBeDefined();
      expect(iosConfig.biometric.cancelLabel).toBeDefined();
    });

    it('should detect iOS platform correctly', () => {
      const { isIOS } = require('@config/ios');
      expect(isIOS()).toBe(true);
    });
  });

  describe('Store Configuration', () => {
    it('should export Redux store', () => {
      const { store } = require('@store');
      expect(store).toBeDefined();
      expect(store.getState).toBeDefined();
      expect(store.dispatch).toBeDefined();
    });

    it('should have auth slice', () => {
      const { store } = require('@store');
      const state = store.getState();
      expect(state.auth).toBeDefined();
    });

    it('should export Redux hooks', () => {
      const { useAppDispatch, useAppSelector } = require('@store/hooks');
      expect(useAppDispatch).toBeDefined();
      expect(useAppSelector).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('should have app directory structure', () => {
      expect(() => require('../app/_layout')).not.toThrow();
    });
  });

  describe('Components', () => {
    it('should export Loading component', () => {
      const { Loading } = require('@components');
      expect(Loading).toBeDefined();
    });

    it('should export student components', () => {
      const { WelcomeCard } = require('@components/student');
      expect(WelcomeCard).toBeDefined();
    });
  });

  describe('API Client', () => {
    it('should export API client', () => {
      const { apiClient } = require('@api/client');
      expect(apiClient).toBeDefined();
    });

    it('should have auth API', () => {
      const { authApi } = require('@api/authApi');
      expect(authApi).toBeDefined();
      expect(authApi.login).toBeDefined();
      expect(authApi.logout).toBeDefined();
    });
  });

  describe('Constants', () => {
    it('should export app constants', () => {
      const constants = require('@constants');
      expect(constants.COLORS).toBeDefined();
      expect(constants.SPACING).toBeDefined();
      expect(constants.STORAGE_KEYS).toBeDefined();
    });

    it('should have storage keys for iOS features', () => {
      const { STORAGE_KEYS } = require('@constants');
      expect(STORAGE_KEYS.ACCESS_TOKEN).toBeDefined();
      expect(STORAGE_KEYS.REFRESH_TOKEN).toBeDefined();
      expect(STORAGE_KEYS.BIOMETRIC_ENABLED).toBeDefined();
    });
  });
});

describe('iOS Feature Integration', () => {
  describe('Authentication Flow', () => {
    it('should have complete auth slice', () => {
      const authSlice = require('@store/slices/authSlice');
      expect(authSlice.login).toBeDefined();
      expect(authSlice.logout).toBeDefined();
      expect(authSlice.loginWithBiometric).toBeDefined();
      expect(authSlice.enableBiometric).toBeDefined();
      expect(authSlice.disableBiometric).toBeDefined();
      expect(authSlice.loadStoredAuth).toBeDefined();
    });
  });

  describe('Offline Support', () => {
    it('should have offline initialization', () => {
      const { initializeOfflineSupport } = require('@utils/offlineInit');
      expect(initializeOfflineSupport).toBeDefined();
      expect(typeof initializeOfflineSupport).toBe('function');
    });
  });

  describe('Background Sync', () => {
    it('should have background sync service', () => {
      const backgroundSync = require('@utils/backgroundSync');
      expect(backgroundSync).toBeDefined();
    });
  });
});

describe('TypeScript Configuration', () => {
  it('should have valid tsconfig.json', () => {
    const tsconfig = require('../tsconfig.json');
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@store']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@components']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@utils']).toBeDefined();
  });
});

describe('Expo Configuration', () => {
  it('should have valid app.json', () => {
    const appJson = require('../app.json');
    expect(appJson.expo).toBeDefined();
    expect(appJson.expo.ios).toBeDefined();
  });

  it('should have iOS bundle identifier', () => {
    const appJson = require('../app.json');
    expect(appJson.expo.ios.bundleIdentifier).toBe('com.edutrack.app');
  });

  it('should have Face ID permission', () => {
    const appJson = require('../app.json');
    expect(appJson.expo.ios.infoPlist).toBeDefined();
    expect(appJson.expo.ios.infoPlist.NSFaceIDUsageDescription).toBeDefined();
  });

  it('should have required plugins', () => {
    const appJson = require('../app.json');
    expect(appJson.expo.plugins).toBeDefined();
    expect(appJson.expo.plugins).toContain('expo-secure-store');
    expect(appJson.expo.plugins).toContain('expo-local-authentication');
  });
});

describe('Package Dependencies', () => {
  it('should have expo-secure-store', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['expo-secure-store']).toBeDefined();
  });

  it('should have expo-local-authentication', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['expo-local-authentication']).toBeDefined();
  });

  it('should have expo-router', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['expo-router']).toBeDefined();
  });

  it('should have Redux dependencies', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['@reduxjs/toolkit']).toBeDefined();
    expect(packageJson.dependencies['react-redux']).toBeDefined();
  });
});
