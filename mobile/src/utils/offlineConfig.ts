export const OFFLINE_CONFIG = {
  QUEUE_MAX_RETRIES: 3,
  
  QUEUE_STORAGE_KEY: '@offline_queue',
  
  LAST_SYNC_KEY: '@last_sync_timestamp',
  
  CACHE_METADATA_KEY: '@cache_metadata',
  
  BACKGROUND_SYNC_INTERVAL: 15 * 60,
  
  CACHE_EXPIRATION: {
    DASHBOARD: 5 * 60 * 1000,
    ASSIGNMENTS: 10 * 60 * 1000,
    GRADES: 10 * 60 * 1000,
    PROFILE: 30 * 60 * 1000,
  },
  
  PERSIST_WHITELIST: ['auth', 'profile', 'dashboard', 'assignments', 'grades'],
  
  NETWORK_CHECK_TIMEOUT: 10000,
  
  QUEUE_METHODS: ['POST', 'PUT', 'PATCH', 'DELETE'] as const,
  
  MAX_CACHE_SIZE_MB: 50,
  
  AUTO_SYNC_ON_RECONNECT: true,
  
  SHOW_OFFLINE_INDICATOR: true,
  
  ENABLE_BACKGROUND_SYNC: true,
} as const;

export type OfflineConfig = typeof OFFLINE_CONFIG;
