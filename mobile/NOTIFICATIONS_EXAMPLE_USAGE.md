# Notification System - Example Usage

This document provides practical examples of using the notification system in different parts of the application.

## Basic Setup

### 1. Add NotificationHandler to App Root

```typescript
// App.tsx or app/_layout.tsx (for Expo Router)
import React from 'react';
import { NotificationHandler } from './src/components/NotificationHandler';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <NavigationContainer>
      <NotificationHandler />
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### 2. Register Device on Login

```typescript
// src/screens/auth/LoginScreen.tsx
import { registerDevice } from '../services/notificationService';

const handleLogin = async credentials => {
  try {
    const response = await authApi.login(credentials);
    const { user, token } = response.data;

    // Save auth data
    await saveAuthData(user, token);

    // Register device for push notifications
    if (user.id) {
      const registered = await registerDevice(user.id);
      if (registered) {
        console.log('Device registered for push notifications');
      }
    }

    navigation.navigate('Home');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

## Screen Examples

### Notification List Screen

```typescript
// src/screens/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationApi } from '../api/notifications';
import { scheduleBadgeUpdate } from '../services/notificationService';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications({
        limit: 50,
      });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    try {
      await notificationApi.markAsRead(notification.id);
      await scheduleBadgeUpdate();

      // Navigate based on type
      if (notification.data?.screen) {
        navigation.navigate(notification.data.screen, {
          id: notification.data.id,
          ...notification.data.params,
        });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      await scheduleBadgeUpdate();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.status !== 'read' && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.notificationDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllRead}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllRead: {
    color: '#007AFF',
    fontSize: 14,
  },
  notificationItem: {
    backgroundColor: '#FFF',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
});
```

### Settings Screen with Notification Preferences Link

```typescript
// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => navigation.navigate('NotificationPreferences')}
      >
        <Text style={styles.settingLabel}>Notification Preferences</Text>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      {/* Other settings items */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingArrow: {
    fontSize: 24,
    color: '#999',
  },
});
```

### Home Screen with Notification Badge

```typescript
// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationApi } from '../api/notifications';
import { useNotifications } from '../hooks/useNotifications';

export default function HomeScreen({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { notification } = useNotifications();

  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Reload count when new notification received
  useEffect(() => {
    if (notification) {
      loadUnreadCount();
    }
  }, [notification]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationApi.getStats();
      setUnreadCount(response.data?.unread || 0);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Rest of home screen content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## API Integration Examples

### Send Notification When Creating Assignment

```typescript
// src/services/assignmentService.ts
import { apiClient } from '../api/client';

export const createAssignment = async (assignmentData: AssignmentCreate) => {
  const response = await apiClient.post('/api/v1/assignments/', assignmentData);

  // Backend automatically sends notifications to enrolled students
  // No additional client-side code needed

  return response.data;
};
```

### Custom Notification Trigger

```typescript
// src/screens/AssignmentDetailScreen.tsx
const handleSubmitAssignment = async (assignmentId: number) => {
  try {
    await apiClient.post(`/api/v1/assignments/${assignmentId}/submit`, submissionData);

    // Backend will send notification to teacher
    // Client just needs to show success message

    Alert.alert('Success', 'Assignment submitted successfully');
  } catch (error) {
    Alert.alert('Error', 'Failed to submit assignment');
  }
};
```

## Advanced Usage

### Custom Notification Handler

```typescript
// src/utils/notificationHandler.ts
import { Notification } from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';

export function createNotificationHandler(
  navigationRef: React.RefObject<NavigationContainerRef<any>>
) {
  return async (notification: Notification) => {
    const data = notification.request.content.data;

    // Custom logic based on notification type
    switch (data.type) {
      case 'assignments':
        navigationRef.current?.navigate('Assignments', {
          screen: 'AssignmentDetail',
          params: { id: data.id },
        });
        break;

      case 'grades':
        navigationRef.current?.navigate('Grades', {
          screen: 'GradeDetail',
          params: { id: data.id },
        });
        break;

      case 'urgent_announcement':
        // Show immediate alert for urgent announcements
        Alert.alert(notification.request.content.title, notification.request.content.body, [
          {
            text: 'View',
            onPress: () => {
              navigationRef.current?.navigate('Announcements', {
                screen: 'AnnouncementDetail',
                params: { id: data.id },
              });
            },
          },
          { text: 'Dismiss', style: 'cancel' },
        ]);
        break;

      default:
        // Default navigation
        if (data.screen) {
          navigationRef.current?.navigate(data.screen, data.params);
        }
    }
  };
}
```

### Conditional Registration Based on User Role

```typescript
// src/hooks/useAuth.ts
import { registerDevice, subscribeToTopic } from '../services/notificationService';

export function useAuth() {
  const login = async credentials => {
    const response = await authApi.login(credentials);
    const { user, token } = response.data;

    // Register device
    await registerDevice(user.id);

    // Subscribe to role-specific topics
    if (user.role === 'student') {
      await subscribeToTopic('assignments');
      await subscribeToTopic('grades');
      await subscribeToTopic('attendance');
    } else if (user.role === 'teacher') {
      await subscribeToTopic('submissions');
      await subscribeToTopic('class_updates');
    } else if (user.role === 'parent') {
      await subscribeToTopic('child_updates');
      await subscribeToTopic('school_announcements');
    }

    // All roles get announcements
    await subscribeToTopic('announcements');

    return user;
  };

  return { login };
}
```

### Notification Preferences Sync

```typescript
// src/hooks/useNotificationPreferences.ts
import { useState, useEffect } from 'react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../services/notificationService';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      await saveNotificationPreferences(updated);
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      throw error;
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    refresh: loadPreferences,
  };
}
```

## Testing Examples

### Mock Notification for Development

```typescript
// src/utils/testNotifications.ts
import * as Notifications from 'expo-notifications';

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Assignment",
      body: "This is a test notification",
      data: {
        screen: "Assignment",
        id: 123,
        type: "assignments",
      },
    },
    trigger: {
      seconds: 2,
    },
  });
}

// Usage in a test screen
<Button title="Send Test Notification" onPress={sendTestNotification} />
```

These examples cover the most common use cases for the notification system. Adapt them to fit your specific application structure and requirements.
