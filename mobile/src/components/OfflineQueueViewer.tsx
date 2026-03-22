import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useOfflineSync } from '@hooks/useOfflineSync';
import { QueuedRequest, QueuedRequestType } from '@utils/offlineQueue';
import { formatDistanceToNow } from 'date-fns';

interface OfflineQueueViewerProps {
  style?: any;
}

const getRequestTypeLabel = (type: QueuedRequestType): string => {
  switch (type) {
    case QueuedRequestType.ASSIGNMENT_SUBMISSION:
      return 'Assignment Submission';
    case QueuedRequestType.ATTENDANCE_MARKING:
      return 'Attendance Marking';
    case QueuedRequestType.DOUBT_POST:
      return 'Doubt Post';
    case QueuedRequestType.DOUBT_ANSWER:
      return 'Doubt Answer';
    case QueuedRequestType.PROFILE_UPDATE:
      return 'Profile Update';
    default:
      return 'Unknown';
  }
};

const getRequestTypeColor = (type: QueuedRequestType): string => {
  switch (type) {
    case QueuedRequestType.ASSIGNMENT_SUBMISSION:
      return '#2196F3';
    case QueuedRequestType.ATTENDANCE_MARKING:
      return '#4CAF50';
    case QueuedRequestType.DOUBT_POST:
      return '#FF9800';
    case QueuedRequestType.DOUBT_ANSWER:
      return '#9C27B0';
    case QueuedRequestType.PROFILE_UPDATE:
      return '#00BCD4';
    default:
      return '#757575';
  }
};

export const OfflineQueueViewer: React.FC<OfflineQueueViewerProps> = ({ style }) => {
  const { queue, queueState, clearQueue, retryFailedRequests } = useOfflineSync();

  const renderItem = ({ item }: { item: QueuedRequest }) => {
    const isFailed = item.retryCount >= item.maxRetries;
    const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

    return (
      <View style={[styles.requestItem, isFailed && styles.requestItemFailed]}>
        <View style={styles.requestHeader}>
          <View
            style={[styles.typeIndicator, { backgroundColor: getRequestTypeColor(item.type) }]}
          />
          <Text style={styles.typeText}>{getRequestTypeLabel(item.type)}</Text>
        </View>

        <Text style={styles.methodText}>
          {item.method} {item.url}
        </Text>

        {item.metadata && (
          <View style={styles.metadataContainer}>
            {Object.entries(item.metadata).map(([key, value]) => (
              <Text key={key} style={styles.metadataText}>
                {key}: {String(value)}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.requestFooter}>
          <Text style={styles.timestampText}>{timeAgo}</Text>
          {isFailed ? (
            <View style={styles.failedBadge}>
              <Text style={styles.failedBadgeText}>Failed</Text>
            </View>
          ) : (
            <Text style={styles.retryText}>
              Retry {item.retryCount}/{item.maxRetries}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (queueState.totalCount === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No queued requests</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Offline Queue ({queueState.totalCount} item{queueState.totalCount !== 1 ? 's' : ''})
        </Text>
        <View style={styles.headerActions}>
          {queueState.failedCount > 0 && (
            <TouchableOpacity style={styles.retryButton} onPress={retryFailedRequests}>
              <Text style={styles.retryButtonText}>Retry Failed</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.clearButton} onPress={clearQueue}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={queue}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestItemFailed: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  methodText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  metadataContainer: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 11,
    color: '#616161',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  retryText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  failedBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  failedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
});
