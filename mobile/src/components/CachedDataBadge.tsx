import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CachedDataBadgeProps {
  lastSyncTime: number | null;
  isOnline?: boolean;
}

export const CachedDataBadge: React.FC<CachedDataBadgeProps> = ({
  lastSyncTime,
  isOnline = true,
}) => {
  if (!lastSyncTime) {
    return null;
  }

  const timeAgo = formatDistanceToNow(lastSyncTime, { addSuffix: true });

  return (
    <View style={styles.container}>
      <Icon
        name={isOnline ? 'cached' : 'cloud-off'}
        size={14}
        color={isOnline ? COLORS.textSecondary : COLORS.error}
        style={styles.icon}
      />
      <Text style={[styles.text, !isOnline && styles.offlineText]}>
        {isOnline ? `Updated ${timeAgo}` : `Cached ${timeAgo}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: SPACING.xs / 2,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  offlineText: {
    color: COLORS.error,
  },
});
