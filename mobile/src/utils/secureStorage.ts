import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storage as asyncStorage } from './storage';

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await asyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error saving to secure storage:', error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await asyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error reading from secure storage:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await asyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing from secure storage:', error);
      throw error;
    }
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving object to secure storage:', error);
      throw error;
    }
  },

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading object from secure storage:', error);
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await asyncStorage.clear();
      } else {
        const keys = [
          '@edu_access_token',
          '@edu_refresh_token',
          '@edu_user_data',
          '@edu_biometric_enabled',
          '@edu_biometric_credentials',
        ];
        for (const key of keys) {
          await SecureStore.deleteItemAsync(key);
        }
      }
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw error;
    }
  },
};
