import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  icon,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.h6.fontWeight,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing[1],
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
    },
    actionText: {
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.primary,
      fontWeight: theme.fontWeights.medium,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={theme.colors.text}
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {actionLabel && onActionPress && (
        <TouchableOpacity style={styles.action} onPress={onActionPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};
