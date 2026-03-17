import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistor } from '../store';

const CACHE_METADATA_KEY = '@cache_metadata';

interface CacheMetadata {
  [key: string]: {
    lastUpdated: number;
    expiresAt: number | null;
  };
}

class CacheManager {
  private metadata: CacheMetadata = {};

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (stored) {
        this.metadata = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load cache metadata:', error);
    }
  }

  async setMetadata(key: string, expirationMs?: number) {
    this.metadata[key] = {
      lastUpdated: Date.now(),
      expiresAt: expirationMs ? Date.now() + expirationMs : null,
    };
    
    try {
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  isExpired(key: string): boolean {
    const meta = this.metadata[key];
    if (!meta) return true;
    if (!meta.expiresAt) return false;
    return Date.now() > meta.expiresAt;
  }

  getLastUpdated(key: string): number | null {
    return this.metadata[key]?.lastUpdated || null;
  }

  async clearExpired() {
    const now = Date.now();
    const expiredKeys = Object.entries(this.metadata)
      .filter(([_, meta]) => meta.expiresAt && now > meta.expiresAt)
      .map(([key]) => key);

    for (const key of expiredKeys) {
      delete this.metadata[key];
    }

    try {
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }

    return expiredKeys;
  }

  async clearAll() {
    try {
      await persistor.purge();
      this.metadata = {};
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  formatCacheSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

export const cacheManager = new CacheManager();
