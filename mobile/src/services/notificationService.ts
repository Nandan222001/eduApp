import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';
const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences';

export type NotificationTopic = 'assignments' | 'grades' | 'attendance' | 'announcements';

export interface NotificationPreferences {
  assignments: boolean;
  grades: boolean;
  attendance: boolean;
  announcements: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  minimumPriority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface DeviceRegistrationData {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  osVersion?: string;
  appVersion?: string;
  topics?: NotificationTopic[];
}

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const preferences = await getNotificationPreferences();

    if (!preferences.pushEnabled) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    const notificationData = notification.request.content.data;
    const notificationType = notificationData?.type as NotificationTopic;

    if (notificationType && !preferences[notificationType]) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    if (preferences.quietHoursEnabled && isInQuietHours(preferences)) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    return currentTime >= startTime || currentTime <= endTime;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('assignments', {
      name: 'Assignments',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });

    await Notifications.setNotificationChannelAsync('grades', {
      name: 'Grades',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });

    await Notifications.setNotificationChannelAsync('attendance', {
      name: 'Attendance',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
    });

    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9C27B0',
    });
  }

  return true;
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const cachedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (cachedToken) {
      return cachedToken;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.error('Error getting Expo Push Token:', error);
    return null;
  }
}

export async function registerDevice(userId: number): Promise<boolean> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      console.log('No push token available');
      return false;
    }

    const deviceData: DeviceRegistrationData = {
      token,
      platform: Platform.OS as 'ios' | 'android' | 'web',
      deviceName: Device.deviceName || undefined,
      osVersion: Device.osVersion || undefined,
      topics: ['assignments', 'grades', 'attendance', 'announcements'],
    };

    await apiClient.post('/api/v1/notifications/register-device', deviceData);
    console.log('Device registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering device:', error);
    return false;
  }
}

export async function unregisterDevice(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (!token) {
      return true;
    }

    await apiClient.delete(`/api/v1/notifications/register-device/${token}`);
    await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
    console.log('Device unregistered successfully');
    return true;
  } catch (error) {
    console.error('Error unregistering device:', error);
    return false;
  }
}

export async function subscribeToTopic(topic: NotificationTopic): Promise<boolean> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return false;
    }

    await apiClient.post(`/api/v1/notifications/subscribe`, {
      token,
      topic,
    });

    const preferences = await getNotificationPreferences();
    preferences[topic] = true;
    await saveNotificationPreferences(preferences);

    console.log(`Subscribed to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
    return false;
  }
}

export async function unsubscribeFromTopic(topic: NotificationTopic): Promise<boolean> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return false;
    }

    await apiClient.post(`/api/v1/notifications/unsubscribe`, {
      token,
      topic,
    });

    const preferences = await getNotificationPreferences();
    preferences[topic] = false;
    await saveNotificationPreferences(preferences);

    console.log(`Unsubscribed from topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
    return false;
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading notification preferences:', error);
  }

  return {
    assignments: true,
    grades: true,
    attendance: true,
    announcements: true,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    quietHoursEnabled: false,
    minimumPriority: 'low',
  };
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));

    await apiClient.put('/api/v1/notifications/preferences/me', {
      push_enabled: preferences.pushEnabled,
      email_enabled: preferences.emailEnabled,
      sms_enabled: preferences.smsEnabled,
      in_app_enabled: preferences.inAppEnabled,
      quiet_hours_enabled: preferences.quietHoursEnabled,
      quiet_hours_start: preferences.quietHoursStart,
      quiet_hours_end: preferences.quietHoursEnd,
      minimum_priority: preferences.minimumPriority,
      push_types: {
        assignments: preferences.assignments,
        grades: preferences.grades,
        attendance: preferences.attendance,
        announcements: preferences.announcements,
      },
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    throw error;
  }
}

export async function scheduleBadgeUpdate(): Promise<void> {
  try {
    const unreadCount = await apiClient.get('/api/v1/notifications/stats');
    const count = unreadCount.data?.unread || 0;
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
}

export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}

export async function dismissNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
}

export async function dismissAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing all notifications:', error);
  }
}

export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling scheduled notification:', error);
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all scheduled notifications:', error);
  }
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
