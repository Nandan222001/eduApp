import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { StudentTabNavigator } from './StudentTabNavigator';
import { ParentTabNavigator } from './ParentTabNavigator';
import { ProfileScreen } from '@screens/common/ProfileScreen';
import { SettingsScreen } from '@screens/common/SettingsScreen';
import { NotificationsScreen } from '@screens/common/NotificationsScreen';
import { NotificationDetailScreen } from '@screens/common/NotificationDetailScreen';
import { CourseDetailScreen } from '@screens/student/CourseDetailScreen';
import { AssignmentDetailScreen } from '@screens/student/AssignmentDetailScreen';
import { ChildDetailScreen } from '@screens/parent/ChildDetailScreen';
import { MessageDetailScreen } from '@screens/parent/MessageDetailScreen';
import { useAuthStore } from '@store';
import { UserRole } from '@types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  const { user } = useAuthStore();

  const getInitialRouteName = () => {
    if (user?.role === UserRole.STUDENT) {
      return 'StudentTabs' as const;
    } else if (user?.role === UserRole.PARENT) {
      return 'ParentTabs' as const;
    }
    return 'StudentTabs' as const;
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StudentTabs" component={StudentTabNavigator} />
      <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, title: 'Profile' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifications' }}
      />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
        options={{ headerShown: true, title: 'Notification' }}
      />

      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{ headerShown: true, title: 'Course Details' }}
      />
      <Stack.Screen
        name="AssignmentDetail"
        component={AssignmentDetailScreen}
        options={{ headerShown: true, title: 'Assignment Details' }}
      />

      <Stack.Screen
        name="ChildDetail"
        component={ChildDetailScreen}
        options={{ headerShown: true, title: 'Child Details' }}
      />
      <Stack.Screen
        name="MessageDetail"
        component={MessageDetailScreen}
        options={{ headerShown: true, title: 'Message' }}
      />
    </Stack.Navigator>
  );
};
