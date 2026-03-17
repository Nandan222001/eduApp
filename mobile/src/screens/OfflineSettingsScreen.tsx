import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { useNetworkStatus, useOfflineQueue } from '@hooks';
import { setAutoSyncEnabled } from '@store/slices/offlineSlice';
import { offlineQueueManager } from '@utils/offlineQueue';
import { BackgroundSyncService } from '@utils/backgroundSync';
import { OfflineIndicator, OfflineQueueStatus, CachedDataBadge, SyncButton } from '@components';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const OfflineSettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isConnected, isInternetReachable, type } = useNetworkStatus();
  const { queueSize } = useOfflineQueue();
  const [syncingQueue, setSyncingQueue] = useState(false);

  const {
    autoSyncEnabled,
    lastSyncTime,
    profileLastSync,
    dashboardLastSync,
    assignmentsLastSync,
    gradesLastSync,
    attendanceLastSync,
  } = useAppSelector(state => ({
    autoSyncEnabled: state.offline.autoSyncEnabled,
    lastSyncTime: state.offline.lastSyncTime,
    profileLastSync: state.studentData.profileLastSync,
    dashboardLastSync: state.studentData.dashboardLastSync,
    assignmentsLastSync: state.studentData.assignmentsLastSync,
    gradesLastSync: state.studentData.gradesLastSync,
    attendanceLastSync: state.studentData.attendanceLastSync,
  }));

  const handleToggleAutoSync = (value: boolean) => {
    dispatch(setAutoSyncEnabled(value));
  };

  const handleClearQueue = async () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear all pending operations? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await offlineQueueManager.clearQueue();
            Alert.alert('Success', 'Queue cleared successfully');
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    setSyncingQueue(true);
    try {
      const result = await offlineQueueManager.manualSync();
      if (result.success) {
        Alert.alert('Success', `Successfully synced ${result.syncedCount} operations`);
      } else {
        Alert.alert(
          'Partial Success',
          `Synced ${result.syncedCount} operations. ${result.failedCount} failed.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync queue. Please try again.');
    } finally {
      setSyncingQueue(false);
    }
  };

  const handleRegisterBackgroundSync = async () => {
    try {
      await BackgroundSyncService.register();
      Alert.alert('Success', 'Background sync registered successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to register background sync');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <OfflineIndicator onSyncPress={handleManualSync} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon
              name={isConnected ? 'wifi' : 'wifi-off'}
              size={24}
              color={isConnected ? COLORS.success : COLORS.error}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Connection Status</Text>
              <Text style={styles.statusValue}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Icon name="language" size={24} color={COLORS.primary} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Internet Access</Text>
              <Text style={styles.statusValue}>
                {isInternetReachable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Icon name="network-cell" size={24} color={COLORS.primary} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Connection Type</Text>
              <Text style={styles.statusValue}>{type || 'Unknown'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Queue</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="cloud-queue" size={24} color={COLORS.primary} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Pending Operations</Text>
              <Text style={styles.statusValue}>{queueSize}</Text>
            </View>
          </View>

          {queueSize > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleManualSync}
                  disabled={!isConnected || syncingQueue}
                  style={[styles.button, styles.syncButton]}
                >
                  <Icon name="sync" size={20} color={COLORS.background} />
                  <Text style={styles.buttonText}>{syncingQueue ? 'Syncing...' : 'Sync Now'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClearQueue}
                  style={[styles.button, styles.clearButton]}
                >
                  <Icon name="delete" size={20} color={COLORS.error} />
                  <Text style={[styles.buttonText, { color: COLORS.error }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <OfflineQueueStatus showDetails={true} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cached Data</Text>
        <View style={styles.card}>
          <View style={styles.cachedItem}>
            <Text style={styles.cachedLabel}>Profile</Text>
            <CachedDataBadge lastSyncTime={profileLastSync} isOnline={isConnected} />
          </View>

          <View style={styles.divider} />

          <View style={styles.cachedItem}>
            <Text style={styles.cachedLabel}>Dashboard</Text>
            <CachedDataBadge lastSyncTime={dashboardLastSync} isOnline={isConnected} />
          </View>

          <View style={styles.divider} />

          <View style={styles.cachedItem}>
            <Text style={styles.cachedLabel}>Assignments</Text>
            <CachedDataBadge lastSyncTime={assignmentsLastSync} isOnline={isConnected} />
          </View>

          <View style={styles.divider} />

          <View style={styles.cachedItem}>
            <Text style={styles.cachedLabel}>Grades</Text>
            <CachedDataBadge lastSyncTime={gradesLastSync} isOnline={isConnected} />
          </View>

          <View style={styles.divider} />

          <View style={styles.cachedItem}>
            <Text style={styles.cachedLabel}>Attendance</Text>
            <CachedDataBadge lastSyncTime={attendanceLastSync} isOnline={isConnected} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Sync</Text>
              <Text style={styles.settingDescription}>Automatically sync data when online</Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity onPress={handleRegisterBackgroundSync} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Background Sync</Text>
              <Text style={styles.settingDescription}>Enable background data synchronization</Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <SyncButton onSyncComplete={() => {}} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  section: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  statusLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  syncButton: {
    backgroundColor: COLORS.primary,
  },
  clearButton: {
    backgroundColor: COLORS.error + '20',
  },
  buttonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
  cachedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cachedLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
