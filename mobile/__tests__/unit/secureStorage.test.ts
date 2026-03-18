import { secureStorage } from '../../src/utils/secureStorage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store item securely', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.setItem('key', 'value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
    });
  });

  describe('getItem', () => {
    it('should retrieve item', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('value');

      const result = await secureStorage.getItem('key');

      expect(result).toBe('value');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
    });

    it('should return null for non-existent item', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await secureStorage.getItem('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should delete item', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.removeItem('key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
    });
  });

  describe('setObject', () => {
    it('should store object as JSON', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const obj = { name: 'Test', value: 123 };
      await secureStorage.setObject('key', obj);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'key',
        JSON.stringify(obj)
      );
    });
  });

  describe('getObject', () => {
    it('should retrieve and parse object', async () => {
      const obj = { name: 'Test', value: 123 };
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(obj));

      const result = await secureStorage.getObject('key');

      expect(result).toEqual(obj);
    });

    it('should return null for invalid JSON', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid json');

      const result = await secureStorage.getObject('key');

      expect(result).toBeNull();
    });
  });
});
