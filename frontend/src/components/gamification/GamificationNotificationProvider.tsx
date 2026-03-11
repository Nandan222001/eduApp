import React from 'react';
import { AchievementNotificationToast } from './index';
import { useGamificationNotifications } from '../../hooks/useGamificationNotifications';

interface GamificationNotificationProviderProps {
  children: React.ReactNode;
}

const GamificationNotificationProvider: React.FC<GamificationNotificationProviderProps> = ({
  children,
}) => {
  const { notification, notificationOpen, hideNotification } = useGamificationNotifications();

  return (
    <>
      {children}
      <AchievementNotificationToast
        open={notificationOpen}
        notification={notification}
        onClose={hideNotification}
      />
    </>
  );
};

export default GamificationNotificationProvider;
