import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  registerDevice,
  scheduleBadgeUpdate,
  NotificationTopic,
} from '../services/notificationService';

interface NotificationData {
  type?: NotificationTopic;
  screen?: string;
  id?: string | number;
  [key: string]: any;
}

export function useNotifications(userId?: number) {
  const navigation = useNavigation();
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (userId) {
      registerDevice(userId).then(success => {
        setIsRegistered(success);
      });
    }
  }, [userId]);

  useEffect(() => {
    notificationListener.current = addNotificationReceivedListener(notification => {
      setNotification(notification);
      scheduleBadgeUpdate();
    });

    responseListener.current = addNotificationResponseReceivedListener(response => {
      handleNotificationTap(response.notification);
    });

    scheduleBadgeUpdate();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleNotificationTap = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;

    if (!data || !data.screen) {
      return;
    }

    switch (data.screen) {
      case 'Assignment':
        if (data.id) {
          navigation.navigate('AssignmentDetail' as never, { id: data.id } as never);
        } else {
          navigation.navigate('Assignments' as never);
        }
        break;

      case 'Grade':
        if (data.id) {
          navigation.navigate('GradeDetail' as never, { id: data.id } as never);
        } else {
          navigation.navigate('Grades' as never);
        }
        break;

      case 'Attendance':
        navigation.navigate('Attendance' as never);
        break;

      case 'Announcement':
        if (data.id) {
          navigation.navigate('AnnouncementDetail' as never, { id: data.id } as never);
        } else {
          navigation.navigate('Announcements' as never);
        }
        break;

      case 'Message':
        if (data.id) {
          navigation.navigate('MessageThread' as never, { id: data.id } as never);
        } else {
          navigation.navigate('Messages' as never);
        }
        break;

      case 'Event':
        if (data.id) {
          navigation.navigate('EventDetail' as never, { id: data.id } as never);
        } else {
          navigation.navigate('Events' as never);
        }
        break;

      default:
        if (data.screen) {
          navigation.navigate(data.screen as never, (data.params || {}) as never);
        }
        break;
    }
  };

  return {
    notification,
    isRegistered,
    handleNotificationTap,
  };
}
