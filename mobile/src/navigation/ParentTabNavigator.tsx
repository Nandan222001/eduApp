import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { ParentTabParamList } from '@types';
import { DashboardScreen } from '@screens/parent/DashboardScreen';
import { ChildrenScreen } from '@screens/parent/ChildrenScreen';
import { CommunicationScreen } from '@screens/parent/CommunicationScreen';
import { ReportsScreen } from '@screens/parent/ReportsScreen';
import { ProfileScreen } from '@screens/parent/ProfileScreen';
import { RoleSwitcher } from '@components/shared/RoleSwitcher';
import { RoleBadge } from '@components/shared/RoleBadge';

const Tab = createBottomTabNavigator<ParentTabParamList>();

const HeaderRight = () => (
  <View style={styles.headerRight}>
    <RoleBadge />
    <RoleSwitcher showLabel={false} />
  </View>
);

export const ParentTabNavigator: React.FC = () => {
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
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" type="material" color={color} size={size} />
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
        name="Communication"
        component={CommunicationScreen}
        options={{
          tabBarLabel: 'Communication',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assessment" type="material" color={color} size={size} />
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
