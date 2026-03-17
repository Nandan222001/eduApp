import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useOfflineQueue } from '@hooks/useOfflineQueue';
import { QueuedOperation, QueuedOperationType } from '@utils/offlineQueue';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatDistanceToNow } from 'date-fns';

interface OfflineQueueStatusProps {
  showDetails?: boolean;
}

const getOperationIcon = (type: QueuedOperationType): string => {
  switch (type) {
    case QueuedOperationType.ASSIGNMENT_SUBMISSION:
      return 'assignment';
    case QueuedOperationType.ATTENDANCE_CHECK_IN:
      return 'check-circle';
    case QueuedOperationType.PROFILE_UPDATE:
      return 'person';
    default:
      return 'sync';
  }
};

const getOperationTitle = (type: QueuedOperationType): string => {
  switch (type) {
    case QueuedOperationType.ASSIGNMENT_SUBMISSION:
      return 'Assignment Submission';
    case QueuedOperationType.ATTENDANCE_CHECK_IN:
      return 'Attendance Check-in';
    case QueuedOperationType.PROFILE_UPDATE:
      return 'Profile Update';
    default:
      return 'Unknown Operation';
  }
};

export const OfflineQueueStatus: React.FC<OfflineQueueStatusProps> = ({ 
  showDetails = false 
}) => {
  const { queue, queueSize, isConnected } = useOfflineQueue();

  if (queueSize === 0) {
    return null;
  }

  const renderQueueItem = ({ item }: { item: QueuedOperation }) => (
    <View style={styles.queueItem}>
      <Icon
        name={getOperationIcon(item.type)}
        size={24}
        color={item.error ? COLORS.error : COLORS.primary}
        style={styles.itemIcon}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{getOperationTitle(item.type)}</Text>
        <Text style={styles.itemTime}>
          Queued {formatDistanceToNow(item.timestamp, { addSuffix: true })}
        </Text>
        {item.error && (
          <Text style={styles.itemError}>
            Error: {item.error} (Retry {item.retryCount}/{item.maxRetries})
          </Text>
        )}
      </View>
      <View style={styles.itemStatus}>
        {item.retryCount > 0 && (
          <View style={styles.retryBadge}>
            <Text style={styles.retryText}>{item.retryCount}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="cloud-queue" size={20} color={COLORS.warning} style={styles.headerIcon} />
        <Text style={styles.headerText}>
          {queueSize} pending operation{queueSize !== 1 ? 's' : ''}
        </Text>
        {!isConnected && (
          <View style={styles.offlineBadge}>
            <Icon name="cloud-off" size={14} color={COLORS.error} />
            <Text style={styles.offlineBadgeText}>Offline</Text>
          </View>
        )}
      </View>
      {showDetails && (
        <FlatList
          data={queue}
          renderItem={renderQueueItem}
          keyExtractor={item => item.id}
          style={styles.list}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: SPACING.xs,
  },
  headerText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 4,
  },
  offlineBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.xs / 2,
  },
  list: {
    marginTop: SPACING.md,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemIcon: {
    marginRight: SPACING.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemError: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: 2,
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  retryBadge: {
    backgroundColor: COLORS.warning,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: 'bold',
  },
});
