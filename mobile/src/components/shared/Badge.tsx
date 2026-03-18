import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  rounded?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  icon,
  rounded = true,
}) => {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.isDark ? theme.colors.primaryDark : theme.colors.primaryLight,
          textColor: theme.colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.isDark ? theme.colors.secondaryDark : theme.colors.secondaryLight,
          textColor: theme.colors.textInverse,
        };
      case 'success':
        return {
          backgroundColor: theme.isDark ? theme.colors.successDark : theme.colors.successLight,
          textColor: theme.colors.textInverse,
        };
      case 'warning':
        return {
          backgroundColor: theme.isDark ? theme.colors.warningDark : theme.colors.warningLight,
          textColor: theme.colors.textInverse,
        };
      case 'error':
        return {
          backgroundColor: theme.isDark ? theme.colors.errorDark : theme.colors.errorLight,
          textColor: theme.colors.textInverse,
        };
      case 'info':
        return {
          backgroundColor: theme.isDark ? theme.colors.infoDark : theme.colors.infoLight,
          textColor: theme.colors.textInverse,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          textColor: theme.colors.text,
        };
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs };
      case 'large':
        return { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm };
      default:
        return { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing[1] };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.fontSizes.xs;
      case 'large':
        return theme.fontSizes.md;
      default:
        return theme.fontSizes.sm;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 18;
      default:
        return 14;
    }
  };

  const { backgroundColor, textColor } = getColors();

  const badgeStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor,
    borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.sm,
    alignSelf: 'flex-start',
    ...getPadding(),
  };

  const textStyle: TextStyle = {
    color: textColor,
    fontSize: getFontSize(),
    fontWeight: theme.fontWeights.medium,
  };

  return (
    <View style={badgeStyle}>
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={getIconSize()}
          color={textColor}
          style={{ marginRight: theme.spacing[1] }}
        />
      )}
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};
