import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  USER_EMAIL: 'userEmail',
  IS_DEMO_USER: 'isDemoUser',
} as const;

export const secureStorage = {
  setAccessToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, token);
  },

  getAccessToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, token);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  clearTokens: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
    ]);
  },

  setBiometricEnabled: async (enabled: boolean): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  },

  getBiometricEnabled: async (): Promise<boolean> => {
    const value = await SecureStore.getItemAsync(TOKEN_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  setUserEmail: async (email: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.USER_EMAIL, email);
  },

  getUserEmail: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEYS.USER_EMAIL);
  },

  setIsDemoUser: async (isDemoUser: boolean): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.IS_DEMO_USER, isDemoUser.toString());
  },

  getIsDemoUser: async (): Promise<boolean> => {
    const value = await SecureStore.getItemAsync(TOKEN_KEYS.IS_DEMO_USER);
    return value === 'true';
  },

  clearAll: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(TOKEN_KEYS.BIOMETRIC_ENABLED),
      SecureStore.deleteItemAsync(TOKEN_KEYS.USER_EMAIL),
      SecureStore.deleteItemAsync(TOKEN_KEYS.IS_DEMO_USER),
    ]);
  },
};
