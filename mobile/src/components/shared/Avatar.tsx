import React from 'react';
import { View, Image, Text, ViewStyle, TextStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  rounded?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'medium',
  icon,
  backgroundColor,
  textColor,
  rounded = true,
}) => {
  const { theme } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      case 'xlarge':
        return 96;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.fontSizes.sm;
      case 'medium':
        return theme.fontSizes.lg;
      case 'large':
        return theme.fontSizes.xl;
      case 'xlarge':
        return theme.fontSizes['3xl'];
      default:
        return theme.fontSizes.lg;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 24;
      case 'large':
        return 32;
      case 'xlarge':
        return 48;
      default:
        return 24;
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarSize = getSize();
  const bgColor = backgroundColor || theme.colors.primary;
  const txtColor = textColor || theme.colors.textInverse;

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: rounded ? avatarSize / 2 : theme.borderRadius.md,
    backgroundColor: bgColor,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  const textStyle: TextStyle = {
    color: txtColor,
    fontSize: getFontSize(),
    fontWeight: theme.fontWeights.semibold,
  };

  if (uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri }}
          style={{ width: avatarSize, height: avatarSize }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (icon) {
    return (
      <View style={containerStyle}>
        <MaterialCommunityIcons name={icon} size={getIconSize()} color={txtColor} />
      </View>
    );
  }

  if (name) {
    return (
      <View style={containerStyle}>
        <Text style={textStyle}>{getInitials(name)}</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <MaterialCommunityIcons name="account" size={getIconSize()} color={txtColor} />
    </View>
  );
};
