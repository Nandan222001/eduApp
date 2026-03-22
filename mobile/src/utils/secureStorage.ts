import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  USER_EMAIL: 'userEmail',
  IS_DEMO_USER: 'isDemoUser',
} as const;

// Lazy load SecureStore only on native platforms
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// Storage abstraction layer
const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const secureStorage = {
  setAccessToken: async (token: string): Promise<void> => {
    await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
  },

  getAccessToken: async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await Promise.all([
      storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
      storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  clearTokens: async (): Promise<void> => {
    await Promise.all([
      storage.deleteItem(TOKEN_KEYS.ACCESS_TOKEN),
      storage.deleteItem(TOKEN_KEYS.REFRESH_TOKEN),
      storage.deleteItem(TOKEN_KEYS.IS_DEMO_USER),
    ]);
  },

  setBiometricEnabled: async (enabled: boolean): Promise<void> => {
    await storage.setItem(TOKEN_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  },

  getBiometricEnabled: async (): Promise<boolean> => {
    const value = await storage.getItem(TOKEN_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  setUserEmail: async (email: string): Promise<void> => {
    await storage.setItem(TOKEN_KEYS.USER_EMAIL, email);
  },

  getUserEmail: async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_KEYS.USER_EMAIL);
  },

  setIsDemoUser: async (isDemoUser: boolean): Promise<void> => {
    await storage.setItem(TOKEN_KEYS.IS_DEMO_USER, isDemoUser.toString());
  },

  getIsDemoUser: async (): Promise<boolean> => {
    const value = await storage.getItem(TOKEN_KEYS.IS_DEMO_USER);
    return value === 'true';
  },

  setDemoUser: async (isDemoUser: boolean): Promise<void> => {
    await storage.setItem(TOKEN_KEYS.IS_DEMO_USER, isDemoUser.toString());
  },

  getDemoUser: async (): Promise<boolean> => {
    const value = await storage.getItem(TOKEN_KEYS.IS_DEMO_USER);
    return value === 'true';
  },

  clearDemoUser: async (): Promise<void> => {
    await storage.deleteItem(TOKEN_KEYS.IS_DEMO_USER);
  },

  clearAll: async (): Promise<void> => {
    await Promise.all([
      storage.deleteItem(TOKEN_KEYS.ACCESS_TOKEN),
      storage.deleteItem(TOKEN_KEYS.REFRESH_TOKEN),
      storage.deleteItem(TOKEN_KEYS.BIOMETRIC_ENABLED),
      storage.deleteItem(TOKEN_KEYS.USER_EMAIL),
      storage.deleteItem(TOKEN_KEYS.IS_DEMO_USER),
    ]);
  },

  // Generic storage methods
  setItem: async (key: string, value: string): Promise<void> => {
    await storage.setItem(key, value);
  },

  getItem: async (key: string): Promise<string | null> => {
    return await storage.getItem(key);
  },

  removeItem: async (key: string): Promise<void> => {
    await storage.deleteItem(key);
  },

  setObject: async <T>(key: string, value: T): Promise<void> => {
    await storage.setItem(key, JSON.stringify(value));
  },

  getObject: async <T>(key: string): Promise<T | null> => {
    const value = await storage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
};
