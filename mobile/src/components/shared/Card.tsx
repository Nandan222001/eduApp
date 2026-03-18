import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  elevation?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding,
  elevation = 'base',
  bordered = false,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: padding !== undefined ? padding : theme.spacing.md,
    ...theme.shadows[elevation],
    ...(bordered && {
      borderWidth: 1,
      borderColor: theme.colors.border,
    }),
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
};
