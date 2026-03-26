/**
 * Offline Functionality Demo Component
 * 
 * Demonstrates all offline features:
 * - Network status detection
 * - Queue management
 * - Manual sync
 * - Cached data display
 * - Request retry
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useOffline } from '@hooks/useOffline';
import { QueuedRequestType } from '@utils/offlineQueue';
import { format } from 'date-fns';

export const OfflineDemo: React.FC = () => {
  const {
    isOnline,
    queuedOperations,
    pendingActions,
    lastSyncTime,
    syncInProgress,
    autoSyncEnabled,
    queueRequest,
    queueAction,
    triggerSync,
    getQueueState,
    checkConnection,
    clearQueue,
    getRequestsByType,
  } = useOffline();

  const [queueState, setQueueState] = useState({ totalCount: 0, pendingCount: 0, failedCount: 0 });

  const updateQueueState = useCallback(() => {
    const state = getQueueState();
    setQueueState(state);
  }, [getQueueState]);

  useEffect(() => {
    updateQueueState();
  }, [queuedOperations, updateQueueState]);

  const handleTestRequest = async () => {
    try {
      const requestId = await queueRequest(
        QueuedRequestType.ASSIGNMENT_SUBMISSION,
        '/api/assignments/test/submit',
        'POST',
        { content: `Test submission at ${new Date().toISOString()}` },
        { 'X-Test-Header': 'true' },
        { testId: Date.now() }
      );
      
      Alert.alert(
        'Request Queued',
        `Request ID: ${requestId}\nStatus: ${isOnline ? 'Will sync now' : 'Queued for later'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to queue request');
    }
  };

  const handleTestAction = () => {
    const actionId = queueAction('TEST_ACTION', {
      timestamp: Date.now(),
      message: 'Test action from demo',
    });
    
    Alert.alert('Action Queued', `Action ID: ${actionId}`);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline');
      return;
    }

    try {
      await triggerSync();
      Alert.alert('Sync Complete', 'All queued items have been synced');
      updateQueueState();
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to sync queued items');
    }
  };

  const handleCheckConnection = async () => {
    const connected = await checkConnection();
    Alert.alert(
      'Connection Status',
      connected ? 'Device is online' : 'Device is offline'
    );
  };

  const handleClearQueue = async () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear all queued items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearQueue();
            updateQueueState();
            Alert.alert('Queue Cleared', 'All queued items have been removed');
          },
        },
      ]
    );
  };

  const handleViewByType = () => {
    const assignmentRequests = getRequestsByType(QueuedRequestType.ASSIGNMENT_SUBMISSION);
    Alert.alert(
      'Assignment Submissions',
      `Found ${assignmentRequests.length} queued assignment submissions`
    );
  };

  const renderStatusCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Network Status</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
        <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
      </View>
      
      {lastSyncTime && (
        <Text style={styles.syncTime}>
          Last Sync: {format(lastSyncTime, 'MMM d, yyyy h:mm a')}
        </Text>
      )}
      
      {syncInProgress && (
        <View style={styles.syncingRow}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      )}
    </View>
  );

  const renderQueueStats = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Queue Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queueState.totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queueState.pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queueState.failedCount}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>
      
      <Text style={styles.infoText}>
        Queued Operations: {queuedOperations.length}
      </Text>
      <Text style={styles.infoText}>
        Pending Actions: {pendingActions.length}
      </Text>
      <Text style={styles.infoText}>
        Auto Sync: {autoSyncEnabled ? 'Enabled' : 'Disabled'}
      </Text>
    </View>
  );

  const renderQueueItems = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Queued Items</Text>
      {queuedOperations.length === 0 ? (
        <Text style={styles.emptyText}>No items in queue</Text>
      ) : (
        <ScrollView style={styles.queueList}>
          {queuedOperations.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.queueItem}>
              <Text style={styles.queueItemTitle}>
                {item.type} - {item.method}
              </Text>
              <Text style={styles.queueItemUrl}>{item.url}</Text>
              <Text style={styles.queueItemMeta}>
                Retries: {item.retryCount}/{item.maxRetries}
              </Text>
            </View>
          ))}
          {queuedOperations.length > 5 && (
            <Text style={styles.moreText}>
              ...and {queuedOperations.length - 5} more
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Test Actions</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleTestRequest}>
        <Text style={styles.buttonText}>Queue Test Request</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleTestAction}>
        <Text style={styles.buttonText}>Queue Test Action</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, !isOnline && styles.buttonDisabled]}
        onPress={handleManualSync}
        disabled={!isOnline}
      >
        <Text style={styles.buttonText}>Manual Sync</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleCheckConnection}>
        <Text style={styles.buttonText}>Check Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleViewByType}>
        <Text style={styles.buttonText}>View Assignments</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.buttonDanger]}
        onPress={handleClearQueue}
      >
        <Text style={styles.buttonText}>Clear Queue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Offline Functionality Demo</Text>
      
      {renderStatusCard()}
      {renderQueueStats()}
      {renderQueueItems()}
      {renderActions()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This demo showcases offline queue management, background sync,
          and network status monitoring.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  syncTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  syncingText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  queueList: {
    maxHeight: 200,
  },
  queueItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  queueItemUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  queueItemMeta: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginVertical: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonDanger: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default OfflineDemo;
