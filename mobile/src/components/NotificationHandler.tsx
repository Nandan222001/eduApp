import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuthStore } from '../store/authStore';

export const NotificationHandler: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { notification, isRegistered } = useNotifications(user?.id);

  useEffect(() => {
    if (isRegistered) {
      console.log('Device registered for push notifications');
    }
  }, [isRegistered]);

  useEffect(() => {
    if (notification) {
      console.log('Received notification:', notification);
    }
  }, [notification]);

  return null;
};
