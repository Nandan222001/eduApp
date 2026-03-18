import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { goalNotificationService } from '@services/goalNotificationService';
import { goalsApi } from '@api/goals';

export const useGoalNotifications = () => {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await goalNotificationService.scheduleWeeklyGoalDigest();

        const activeGoalsResponse = await goalsApi.getGoals('active');
        const activeGoals = activeGoalsResponse.data || [];
        
        if (activeGoals.length > 0) {
          await goalNotificationService.scheduleGoalReminders(activeGoals);
        }
      } catch (error) {
        console.error('Failed to initialize goal notifications:', error);
      }
    };

    initializeNotifications();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        initializeNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
};
