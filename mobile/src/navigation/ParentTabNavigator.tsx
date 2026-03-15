import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { ParentTabParamList } from '@types';
import { DashboardScreen } from '@screens/parent/DashboardScreen';
import { ChildrenScreen } from '@screens/parent/ChildrenScreen';
import { GradesScreen } from '@screens/parent/GradesScreen';
import { AttendanceScreen } from '@screens/parent/AttendanceScreen';
import { MessagesScreen } from '@screens/parent/MessagesScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

export const ParentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Children"
        component={ChildrenScreen}
        options={{
          tabBarLabel: 'Children',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" type="material" color={color} size={size} />
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
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Icon name="event-available" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
