import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface SecureStorageOptions {
  keychainAccessible?: number;
  requireAuthentication?: boolean;
}

class SecureStorageService {
  private prefix = '@edu_secure_';

  async setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      
      if (Platform.OS === 'web') {
        localStorage.setItem(fullKey, value);
        return;
      }

      const storeOptions: SecureStore.SecureStoreOptions = {};
      
      if (options?.keychainAccessible && Platform.OS === 'ios') {
        storeOptions.keychainAccessible = options.keychainAccessible;
      }

      if (options?.requireAuthentication && Platform.OS === 'android') {
        storeOptions.requireAuthentication = true;
        storeOptions.authenticationPrompt = 'Authenticate to access secure data';
      }

      await SecureStore.setItemAsync(fullKey, value, storeOptions);
    } catch (error) {
      console.error('Error saving to secure storage:', error);
      throw error;
    }
  }

  async getItem(
    key: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    try {
      const fullKey = this.prefix + key;
      
      if (Platform.OS === 'web') {
        return localStorage.getItem(fullKey);
      }

      const storeOptions: SecureStore.SecureStoreOptions = {};
      
      if (options?.requireAuthentication && Platform.OS === 'android') {
        storeOptions.requireAuthentication = true;
        storeOptions.authenticationPrompt = 'Authenticate to access secure data';
      }

      return await SecureStore.getItemAsync(fullKey, storeOptions);
    } catch (error) {
      console.error('Error reading from secure storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(fullKey);
        return;
      }

      await SecureStore.deleteItemAsync(fullKey);
    } catch (error) {
      console.error('Error removing from secure storage:', error);
      throw error;
    }
  }

  async setObject<T>(
    key: string,
    value: T,
    options?: SecureStorageOptions
  ): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue, options);
    } catch (error) {
      console.error('Error saving object to secure storage:', error);
      throw error;
    }
  }

  async getObject<T>(
    key: string,
    options?: SecureStorageOptions
  ): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key, options);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading object from secure storage:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
        keys.forEach(key => localStorage.removeItem(key));
        return;
      }

      const keys = [
        'auth_token',
        'refresh_token',
        'user_data',
        'biometric_credentials',
        'pin_hash',
        'device_fingerprint',
        'session_data',
      ];

      await Promise.all(
        keys.map(key => this.removeItem(key))
      );
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw error;
    }
  }
}

export const secureStorage = new SecureStorageService();
