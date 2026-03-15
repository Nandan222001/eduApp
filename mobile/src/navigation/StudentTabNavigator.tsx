import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { StudentTabParamList } from '@types';
import { DashboardScreen } from '@screens/student/DashboardScreen';
import { CoursesScreen } from '@screens/student/CoursesScreen';
import { AssignmentsScreen } from '@screens/student/AssignmentsScreen';
import { GradesScreen } from '@screens/student/GradesScreen';
import { ScheduleScreen } from '@screens/student/ScheduleScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();

export const StudentTabNavigator: React.FC = () => {
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
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Icon name="book" type="material" color={color} size={size} />
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
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Icon name="schedule" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
