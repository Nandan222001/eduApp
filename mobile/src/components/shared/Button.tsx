import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled,
  icon,
  iconPosition = 'left',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = (): string => {
    if (disabled) return theme.colors.disabled;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
      case 'ghost':
        return theme.colors.transparent;
      case 'danger':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.disabledText;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return theme.colors.textInverse;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.textInverse;
    }
  };

  const getBorderColor = (): string | undefined => {
    if (variant === 'outline') {
      return disabled ? theme.colors.disabled : theme.colors.primary;
    }
    return undefined;
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm };
      case 'large':
        return { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg };
      default:
        return { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.bodySmall.fontSize;
      case 'large':
        return theme.typography.h6.fontSize;
      default:
        return theme.typography.button.fontSize;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: getBackgroundColor(),
    ...getPadding(),
    ...(variant === 'outline' && { borderWidth: 1, borderColor: getBorderColor() }),
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.5 }),
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: theme.typography.button.fontWeight,
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} />;
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <MaterialCommunityIcons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        <Text style={textStyle}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <MaterialCommunityIcons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={{ marginLeft: theme.spacing.sm }}
          />
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
