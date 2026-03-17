import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MainStackParamList } from '@types';
import { StudentTabNavigator } from './StudentTabNavigator';
import { ParentTabNavigator } from './ParentTabNavigator';
import { ProfileScreen } from '@screens/common/ProfileScreen';
import { SettingsScreen } from '@screens/common/SettingsScreen';
import { NotificationsScreen } from '@screens/common/NotificationsScreen';
import { NotificationDetailScreen } from '@screens/common/NotificationDetailScreen';
import { CoursesScreen } from '@screens/student/CoursesScreen';
import { CourseDetailScreen } from '@screens/student/CourseDetailScreen';
import { AssignmentDetailScreen } from '@screens/student/AssignmentDetailScreen';
import { GradesScreen } from '@screens/parent/GradesScreen';
import { AttendanceScreen } from '@screens/parent/AttendanceScreen';
import { MessagesScreen } from '@screens/parent/MessagesScreen';
import { ChildDetailScreen } from '@screens/parent/ChildDetailScreen';
import { MessageDetailScreen } from '@screens/parent/MessageDetailScreen';
import { useAppSelector } from '@store/hooks';
import { UserRole } from '@types';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigatorContent: React.FC = () => {
  const navigation = useNavigation();
  const { activeRole } = useAppSelector(state => state.auth);
  const previousRoleRef = useRef(activeRole);

  useEffect(() => {
    if (previousRoleRef.current !== activeRole && activeRole) {
      const targetScreen = activeRole === UserRole.PARENT ? 'ParentTabs' : 'StudentTabs';
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetScreen }],
        })
      );
      
      previousRoleRef.current = activeRole;
    }
  }, [activeRole, navigation]);

  return null;
};

export const MainNavigator: React.FC = () => {
  const { activeRole } = useAppSelector(state => state.auth);

  const getInitialRouteName = () => {
    if (activeRole === UserRole.STUDENT) {
      return 'StudentTabs' as const;
    } else if (activeRole === UserRole.PARENT) {
      return 'ParentTabs' as const;
    }
    return 'StudentTabs' as const;
  };

  return (
    <>
      <MainNavigatorContent />
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
        name="Courses"
        component={CoursesScreen}
        options={{ headerShown: true, title: 'Courses' }}
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
        name="Grades"
        component={GradesScreen}
        options={{ headerShown: true, title: 'Grades' }}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ headerShown: true, title: 'Attendance' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: true, title: 'Messages' }}
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
    </>
  );
};
