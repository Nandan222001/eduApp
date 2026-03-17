import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { backgroundSyncService } from '../utils/backgroundSync';
import { networkStatusManager } from '../utils/networkStatus';

interface CachedDataBannerProps {
  lastUpdated: number | null;
  onRefresh: () => Promise<void>;
}

export const CachedDataBanner: React.FC<CachedDataBannerProps> = ({ lastUpdated, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    setIsConnected(networkStatusManager.getIsConnected());
    
    const unsubscribe = networkStatusManager.subscribe(setIsConnected);

    backgroundSyncService.getLastSyncTimestamp().then(setLastSyncTime);

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    if (!isConnected) {
      return;
    }

    setIsRefreshing(true);
    try {
      await onRefresh();
      await backgroundSyncService.triggerManualSync();
      const timestamp = await backgroundSyncService.getLastSyncTimestamp();
      setLastSyncTime(timestamp);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!lastUpdated && !lastSyncTime) {
    return null;
  }

  const displayTimestamp = lastUpdated || lastSyncTime;

  return (
    <View style={[styles.container, !isConnected && styles.offlineContainer]}>
      <View style={styles.content}>
        <Text style={styles.label}>
          {isConnected ? '🔄 Last updated:' : '📦 Cached data:'}
        </Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(displayTimestamp)}
        </Text>
      </View>
      
      {isConnected && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.refreshText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#B8DCE8',
  },
  offlineContainer: {
    backgroundColor: '#FFF3CD',
    borderBottomColor: '#FFE69C',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#495057',
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
