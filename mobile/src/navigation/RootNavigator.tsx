import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loadStoredAuth } from '@store/slices/authSlice';
import { Loading } from '@components';
import { RootStackParamList } from '@types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { NavigationContainer } from './NavigationContainer';
import { authService } from '@utils/authService';
import { notificationService } from '@services/notificationService';
import { apiClient } from '@api/client';
import { analyticsService } from '@services/analytics';
import { setSentryUser, clearSentryUser } from '@config/sentry';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector(state => state.auth);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      authService.initializeAuth();
      initializeNotifications();

      analyticsService.setUserId(user.id.toString());
      setSentryUser({
        id: user.id.toString(),
        email: user.email,
        username: user.firstName || user.email,
      });
    } else {
      authService.stopAutoRefresh();
      notificationService.removeNotificationListeners();
      analyticsService.clearUserId();
      clearSentryUser();
    }
  }, [isAuthenticated, user]);

  const initializeNotifications = async () => {
    try {
      await notificationService.registerForPushNotifications();
      await notificationService.registerDeviceWithBackend();

      notificationService.setupNotificationListeners(
        handleNotificationReceived,
        handleNotificationTapped
      );

      const unreadResponse = await apiClient.get<{ unread: number }>(
        '/api/v1/notifications/unread-count'
      );
      await notificationService.setBadgeCount(unreadResponse.data.unread);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const handleNotificationReceived = async (_notification: Notifications.Notification) => {
    try {
      const unreadResponse = await apiClient.get<{ unread: number }>(
        '/api/v1/notifications/unread-count'
      );
      await notificationService.setBadgeCount(unreadResponse.data.unread);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  const handleNotificationTapped = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (navigationRef.current && data) {
      if (data.assignmentId) {
        navigationRef.current.navigate('Main', {
          screen: 'AssignmentDetail',
          params: { assignmentId: data.assignmentId.toString() },
        });
      } else if (data.actionUrl) {
        handleDeepLink(data.actionUrl, data);
      }
    }
  };

  const handleDeepLink = (actionUrl: string, data: any) => {
    if (!navigationRef.current) return;

    if (actionUrl.includes('/assignments/') && data.assignmentId) {
      navigationRef.current.navigate('Main', {
        screen: 'AssignmentDetail',
        params: { assignmentId: data.assignmentId.toString() },
      });
    } else if (actionUrl.includes('/grades')) {
      navigationRef.current.navigate('Main', {
        screen: 'Grades',
        params: {},
      });
    } else if (actionUrl.includes('/attendance')) {
      navigationRef.current.navigate('Main', {
        screen: 'Attendance',
        params: {},
      });
    } else if (actionUrl.includes('/notifications/')) {
      navigationRef.current.navigate('Main', {
        screen: 'NotificationHistory',
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
