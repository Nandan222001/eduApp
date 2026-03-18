import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiClient } from '@api/client';
import { notificationService } from '@services/notificationService';

export const useNotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.get<{ unread: number }>(
        '/api/v1/notifications/unread-count'
      );
      const count = response.data.unread;
      setUnreadCount(count);
      await notificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchUnreadCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchUnreadCount]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      notificationService.setBadgeCount(newCount);
      return newCount;
    });
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
    notificationService.setBadgeCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
  };
};
