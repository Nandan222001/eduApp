import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { offlineQueueManager } from '@utils/offlineQueue';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setLastSyncTime } from '@store/slices/offlineSlice';
import {
  fetchProfile,
  fetchDashboard,
  fetchAssignments,
  fetchGrades,
  fetchAttendance,
} from '@store/slices/studentDataSlice';

interface SyncButtonProps {
  variant?: 'icon' | 'button';
  onSyncComplete?: (success: boolean) => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ 
  variant = 'button',
  onSyncComplete 
}) => {
  const dispatch = useAppDispatch();
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useAppSelector(state => state.offline.isOnline);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your connection.');
      return;
    }

    setIsSyncing(true);

    try {
      const queueResult = await offlineQueueManager.manualSync();
      
      await Promise.all([
        dispatch(fetchProfile()),
        dispatch(fetchDashboard()),
        dispatch(fetchAssignments()),
        dispatch(fetchGrades(undefined)),
        dispatch(fetchAttendance()),
      ]);

      dispatch(setLastSyncTime(Date.now()));

      if (queueResult.failedCount > 0) {
        Alert.alert(
          'Partial Sync',
          `${queueResult.syncedCount} operations synced. ${queueResult.failedCount} failed.`
        );
        onSyncComplete?.(false);
      } else {
        onSyncComplete?.(true);
      }
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync data. Please try again.');
      onSyncComplete?.(false);
    } finally {
      setIsSyncing(false);
    }
  };

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handleSync}
        disabled={isSyncing || !isOnline}
        style={[styles.iconButton, (!isOnline || isSyncing) && styles.disabled]}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Icon name="sync" size={24} color={isOnline ? COLORS.primary : COLORS.disabled} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleSync}
      disabled={isSyncing || !isOnline}
      style={[styles.button, (!isOnline || isSyncing) && styles.disabled]}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color={COLORS.background} />
      ) : (
        <Icon name="sync" size={20} color={COLORS.background} style={styles.icon} />
      )}
      <Text style={styles.buttonText}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
