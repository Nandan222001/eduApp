import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { StudentTabParamList } from '@types';
import { DashboardScreen } from '@screens/student/DashboardScreen';
import { AssignmentsScreen } from '@screens/student/AssignmentsScreen';
import { GradesScreen } from '@screens/student/GradesScreen';
import { ScheduleScreen } from '@screens/student/ScheduleScreen';
import { ProfileScreen } from '@screens/student/ProfileScreen';
import { RoleSwitcher } from '@components/shared/RoleSwitcher';
import { RoleBadge } from '@components/shared/RoleBadge';
import { NotificationBell } from '@components/shared/NotificationBell';

const Tab = createBottomTabNavigator<StudentTabParamList>();

const HeaderRight = () => (
  <View style={styles.headerRight}>
    <NotificationBell />
    <RoleBadge />
    <RoleSwitcher showLabel={false} />
  </View>
);

export const StudentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{
          tabBarLabel: 'Assignments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Icon name="schedule" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Grades"
        component={GradesScreen}
        options={{
          tabBarLabel: 'Grades',
          tabBarIcon: ({ color, size }) => (
            <Icon name="grade" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
