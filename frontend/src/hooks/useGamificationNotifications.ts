import { useState, useEffect, useCallback } from 'react';
import { AchievementNotification } from '../types/gamification';

interface UseGamificationNotificationsReturn {
  notification: AchievementNotification | null;
  notificationOpen: boolean;
  showNotification: (notification: AchievementNotification) => void;
  hideNotification: () => void;
}

export const useGamificationNotifications = (): UseGamificationNotificationsReturn => {
  const [notification, setNotification] = useState<AchievementNotification | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [queue, setQueue] = useState<AchievementNotification[]>([]);

  const showNotification = useCallback((notif: AchievementNotification) => {
    setQueue((prev) => [...prev, notif]);
  }, []);

  const hideNotification = useCallback(() => {
    setNotificationOpen(false);
    setTimeout(() => {
      setNotification(null);
    }, 300);
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !notificationOpen) {
      const nextNotification = queue[0];
      setNotification(nextNotification);
      setNotificationOpen(true);
      setQueue((prev) => prev.slice(1));

      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [queue, notificationOpen, hideNotification]);

  useEffect(() => {
    const handleGamificationEvent = (event: CustomEvent<AchievementNotification>) => {
      showNotification(event.detail);
    };

    window.addEventListener('gamification:achievement', handleGamificationEvent as EventListener);

    return () => {
      window.removeEventListener(
        'gamification:achievement',
        handleGamificationEvent as EventListener
      );
    };
  }, [showNotification]);

  return {
    notification,
    notificationOpen,
    showNotification,
    hideNotification,
  };
};

export const triggerGamificationNotification = (notification: AchievementNotification) => {
  const event = new CustomEvent('gamification:achievement', { detail: notification });
  window.dispatchEvent(event);
};
