import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Icon, Button } from '@rneui/themed';
import { format } from 'date-fns';
import { apiClient } from '@api/client';
import { Notification } from '@types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'NotificationHistory'>;

export const NotificationHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const response = await apiClient.get<{
        notifications: Notification[];
        total: number;
        page: number;
        perPage: number;
      }>(`/api/v1/notifications?page=${pageNum}&limit=20`);

      if (pageNum === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.data.notifications]);
      }

      setHasMore(
        response.data.notifications.length === response.data.perPage
      );
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(1);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await apiClient.delete(`/api/v1/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      handleDeepLink(notification.actionUrl, notification.metadata);
    }
  };

  const handleDeepLink = (actionUrl: string, metadata?: any) => {
    if (actionUrl.includes('/assignments/') && metadata?.assignmentId) {
      navigation.navigate('AssignmentDetail', { assignmentId: metadata.assignmentId.toString() });
    } else if (actionUrl.includes('/grades')) {
      navigation.navigate('Grades', {});
    } else if (actionUrl.includes('/attendance')) {
      navigation.navigate('Attendance', {});
    } else if (actionUrl.includes('/announcements/') && metadata?.announcementId) {
      navigation.navigate('NotificationDetail', { notificationId: metadata.announcementId.toString() });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assignment':
        return { name: 'assignment', color: COLORS.accent };
      case 'exam':
        return { name: 'grade', color: COLORS.success };
      case 'attendance':
        return { name: 'event-available', color: COLORS.warning };
      case 'academic':
        return { name: 'school', color: COLORS.primary };
      case 'fee':
        return { name: 'payment', color: COLORS.error };
      case 'event':
        return { name: 'event', color: COLORS.secondary };
      default:
        return { name: 'campaign', color: COLORS.info };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return COLORS.error;
      case 'high':
        return COLORS.warning;
      case 'medium':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const icon = getCategoryIcon(item.category);
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationLeft}>
          <Icon
            name={icon.name}
            type="material"
            color={icon.color}
            size={24}
            containerStyle={styles.notificationIcon}
          />
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  !item.isRead && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadBadge} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <View style={styles.notificationFooter}>
              <Text style={styles.notificationTime}>
                {format(new Date(item.createdAt), 'MMM dd, yyyy h:mm a')}
              </Text>
              {item.priority !== 'low' && (
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.notificationActions}>
          <TouchableOpacity
            onPress={() => deleteNotification(item.id)}
            style={styles.actionButton}
          >
            <Icon name="delete" type="material" color={COLORS.error} size={20} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="notifications-none"
        type="material"
        color={COLORS.disabled}
        size={64}
      />
      <Text style={styles.emptyText}>No notifications yet</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: COLORS.primary,
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  notificationMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  priorityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationActions: {
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
});
