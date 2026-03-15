import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@components';
import { useAuthStore } from '@store';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome, {user?.firstName}!</Text>
        <Text style={styles.subtitle}>Role: {user?.role}</Text>
      </View>

      <Button title="Logout" onPress={logout} variant="outline" fullWidth />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
});
