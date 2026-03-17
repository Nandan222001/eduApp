import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';
import { RoleSwitcher } from '@components/shared/RoleSwitcher';
import { RoleBadge } from '@components/shared/RoleBadge';

const HeaderRight = () => (
  <View style={styles.headerRight}>
    <RoleBadge />
    <RoleSwitcher showLabel={false} />
  </View>
);

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          tabBarLabel: 'Assignments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Icon name="schedule" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          tabBarLabel: 'Grades',
          tabBarIcon: ({ color, size }) => (
            <Icon name="grade" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-predictions"
        options={{
          title: 'AI Predictions',
          tabBarLabel: 'AI',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Icon name="psychology" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="homework-scanner"
        options={{
          title: 'Homework Scanner',
          tabBarLabel: 'Scanner',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Icon name="camera" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="study-buddy"
        options={{
          title: 'Study Buddy',
          tabBarLabel: 'Buddy',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
