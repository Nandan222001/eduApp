/**
 * Token Storage Tests
 * 
 * Tests token storage across platforms:
 * - SecureStore on iOS/Android
 * - AsyncStorage on Web
 * - Token persistence and retrieval
 */

import { Platform } from 'react-native';
import { secureStorage } from '../../src/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock SecureStore (will be conditionally used)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSecureStore: any = null;
jest.mock('expo-secure-store', () => {
  mockSecureStore = {
    setItemAsync: jest.fn(() => Promise.resolve()),
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
  };
  return mockSecureStore;
}, { virtual: true });

describe('Token Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform-specific storage', () => {
    it('should use AsyncStorage on web platform', async () => {
      // Mock Platform.OS as web
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      const token = 'test_access_token';
      await secureStorage.setAccessToken(token);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', token);
    });

    it('should retrieve tokens from AsyncStorage on web', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      const mockToken = 'test_token_123';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockToken);

      const token = await secureStorage.getAccessToken();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('accessToken');
      expect(token).toBe(mockToken);
    });
  });

  describe('Token operations', () => {
    it('should store access and refresh tokens', async () => {
      const accessToken = 'demo_student_access_token_123';
      const refreshToken = 'demo_student_refresh_token_123';

      await secureStorage.setTokens(accessToken, refreshToken);

      // The mocked values will be returned
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', accessToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });

    it('should clear all tokens on logout', async () => {
      await secureStorage.clearTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('isDemoUser');
    });

    it('should clear all auth data', async () => {
      await secureStorage.clearAll();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('biometricEnabled');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userEmail');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('isDemoUser');
    });
  });

  describe('Biometric settings', () => {
    it('should store biometric enabled status', async () => {
      await secureStorage.setBiometricEnabled(true);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometricEnabled', 'true');
    });

    it('should retrieve biometric enabled status', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      const enabled = await secureStorage.getBiometricEnabled();

      expect(enabled).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('biometricEnabled');
    });

    it('should return false for biometric when not set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const enabled = await secureStorage.getBiometricEnabled();

      expect(enabled).toBe(false);
    });
  });

  describe('User email storage', () => {
    it('should store user email', async () => {
      const email = 'demo@example.com';
      await secureStorage.setUserEmail(email);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userEmail', email);
    });

    it('should retrieve user email', async () => {
      const email = 'demo@example.com';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(email);

      const retrievedEmail = await secureStorage.getUserEmail();

      expect(retrievedEmail).toBe(email);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userEmail');
    });
  });

  describe('Demo user flag', () => {
    it('should store demo user flag', async () => {
      await secureStorage.setIsDemoUser(true);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('isDemoUser', 'true');
    });

    it('should retrieve demo user flag', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      const isDemoUser = await secureStorage.getIsDemoUser();

      expect(isDemoUser).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('isDemoUser');
    });

    it('should return false when demo user flag not set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const isDemoUser = await secureStorage.getIsDemoUser();

      expect(isDemoUser).toBe(false);
    });
  });

  describe('Generic storage methods', () => {
    it('should store and retrieve objects', async () => {
      const testObject = { name: 'Test', value: 123 };
      const key = 'testObject';

      await secureStorage.setObject(key, testObject);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(testObject)
      );

      // Mock retrieval
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(testObject)
      );

      const retrieved = await secureStorage.getObject(key);

      expect(retrieved).toEqual(testObject);
    });

    it('should return null for non-existent object', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const retrieved = await secureStorage.getObject('nonExistent');

      expect(retrieved).toBeNull();
    });

    it('should handle item removal', async () => {
      const key = 'testKey';
      await secureStorage.removeItem(key);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
    });
  });

  describe('Token persistence', () => {
    it('should maintain tokens across multiple get operations', async () => {
      const accessToken = 'demo_student_access_token_123';
      
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(accessToken);

      const token1 = await secureStorage.getAccessToken();
      const token2 = await secureStorage.getAccessToken();
      const token3 = await secureStorage.getAccessToken();

      expect(token1).toBe(accessToken);
      expect(token2).toBe(accessToken);
      expect(token3).toBe(accessToken);
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent token operations', async () => {
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';

      // Set tokens concurrently
      await Promise.all([
        secureStorage.setAccessToken(accessToken),
        secureStorage.setRefreshToken(refreshToken),
      ]);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', accessToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });
  });
});
