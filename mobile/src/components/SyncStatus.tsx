import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useOfflineQueue } from '../store/hooks';
import { backgroundSyncService } from '../utils/backgroundSync';

export const SyncStatus: React.FC = () => {
  const { queue, queueCount, isConnected, processQueue, clearQueue } = useOfflineQueue();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    loadLastSyncTime();
  }, []);

  const loadLastSyncTime = async () => {
    const timestamp = await backgroundSyncService.getLastSyncTimestamp();
    setLastSyncTime(timestamp);
  };

  const handleManualSync = async () => {
    if (!isConnected) return;

    setIsSyncing(true);
    try {
      await processQueue();
      await backgroundSyncService.triggerManualSync();
      await loadLastSyncTime();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    await clearQueue();
    setModalVisible(false);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatRequestMethod = (method: string): string => {
    const colors: Record<string, string> = {
      GET: '#28A745',
      POST: '#007BFF',
      PUT: '#FFC107',
      PATCH: '#17A2B8',
      DELETE: '#DC3545',
    };
    return colors[method] || '#6C757D';
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.statusButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.statusContent}>
          <Text style={styles.statusText}>
            {isConnected ? '🔄' : '📡'} Sync
          </Text>
          {queueCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{queueCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sync Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusSection}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Connection:</Text>
                <Text style={[styles.statusValue, isConnected ? styles.connected : styles.offline]}>
                  {isConnected ? 'Online' : 'Offline'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Pending Requests:</Text>
                <Text style={styles.statusValue}>{queueCount}</Text>
              </View>
              {lastSyncTime && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Last Sync:</Text>
                  <Text style={styles.statusValue}>
                    {formatTimestamp(lastSyncTime)}
                  </Text>
                </View>
              )}
            </View>

            {isConnected && queueCount > 0 && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.syncButton]}
                  onPress={handleManualSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Sync Now</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={handleClearQueue}
                  disabled={isSyncing}
                >
                  <Text style={styles.buttonText}>Clear Queue</Text>
                </TouchableOpacity>
              </View>
            )}

            {queueCount > 0 && (
              <View style={styles.queueSection}>
                <Text style={styles.sectionTitle}>Queued Requests</Text>
                <FlatList
                  data={queue}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.queueItem}>
                      <View style={styles.queueItemHeader}>
                        <View
                          style={[
                            styles.methodBadge,
                            { backgroundColor: formatRequestMethod(item.method) },
                          ]}
                        >
                          <Text style={styles.methodText}>{item.method}</Text>
                        </View>
                        <Text style={styles.queueItemUrl} numberOfLines={1}>
                          {item.url}
                        </Text>
                      </View>
                      <Text style={styles.queueItemTime}>
                        {formatTimestamp(item.timestamp)}
                      </Text>
                      <Text style={styles.queueItemRetry}>
                        Retry {item.retryCount}/{item.maxRetries}
                      </Text>
                    </View>
                  )}
                  style={styles.queueList}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  statusButton: {
    padding: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#DC3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#6C757D',
  },
  statusSection: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  statusLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  connected: {
    color: '#28A745',
  },
  offline: {
    color: '#DC3545',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#007BFF',
  },
  clearButton: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  queueSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  queueList: {
    flex: 1,
  },
  queueItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  queueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  methodText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  queueItemUrl: {
    flex: 1,
    fontSize: 14,
    color: '#212529',
  },
  queueItemTime: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  queueItemRetry: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
});
