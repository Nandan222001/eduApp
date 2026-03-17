import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { networkStatusManager } from '../utils/networkStatus';
import { offlineQueueManager } from '../utils/offlineQueue';

export const OfflineIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    setIsConnected(networkStatusManager.getIsConnected());
    setQueueCount(offlineQueueManager.getQueueCount());

    const unsubscribeNetwork = networkStatusManager.subscribe(setIsConnected);
    const unsubscribeQueue = offlineQueueManager.subscribe((queue) => {
      setQueueCount(queue.length);
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeQueue();
    };
  }, []);

  if (isConnected && queueCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!isConnected && (
          <Text style={styles.text}>
            📡 Offline Mode
          </Text>
        )}
        {queueCount > 0 && (
          <Text style={styles.queueText}>
            {queueCount} pending {queueCount === 1 ? 'request' : 'requests'}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  queueText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
