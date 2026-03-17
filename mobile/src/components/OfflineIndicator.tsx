import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { useOfflineQueue } from '@hooks/useOfflineQueue';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface OfflineIndicatorProps {
  onSyncPress?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncPress }) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { queueSize } = useOfflineQueue();

  const isOffline = !isConnected || !isInternetReachable;

  if (!isOffline && queueSize === 0) {
    return null;
  }

  return (
    <View style={[styles.container, isOffline && styles.offlineContainer]}>
      <View style={styles.content}>
        <Icon
          name={isOffline ? 'cloud-off' : 'cloud-queue'}
          size={20}
          color={isOffline ? COLORS.error : COLORS.warning}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{isOffline ? 'Offline Mode' : 'Pending Sync'}</Text>
          {queueSize > 0 && (
            <Text style={styles.subtitle}>
              {queueSize} operation{queueSize !== 1 ? 's' : ''} queued
            </Text>
          )}
        </View>
      </View>
      {!isOffline && queueSize > 0 && onSyncPress && (
        <TouchableOpacity onPress={onSyncPress} style={styles.syncButton}>
          <Icon name="sync" size={20} color={COLORS.primary} />
          <Text style={styles.syncText}>Sync</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warning + '40',
  },
  offlineContainer: {
    backgroundColor: COLORS.error + '20',
    borderBottomColor: COLORS.error + '40',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 4,
  },
  syncText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});
