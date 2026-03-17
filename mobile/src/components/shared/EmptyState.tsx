import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

interface EmptyStateProps {
  icon?: string;
  iconType?: string;
  title: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  iconType = 'feather',
  title,
  message,
}) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} type={iconType} size={64} color={COLORS.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
