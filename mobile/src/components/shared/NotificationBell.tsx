import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { useNotificationBadge } from '@hooks/useNotificationBadge';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

export const NotificationBell: React.FC = () => {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotificationBadge();

  const handlePress = () => {
    navigation.navigate('NotificationHistory');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Icon name="notifications" type="material" color={COLORS.text} size={24} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
});
