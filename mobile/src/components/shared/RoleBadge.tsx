import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Badge } from '@rneui/themed';
import { useAppSelector } from '@store/hooks';
import { UserRole } from '@types';
import { COLORS, SPACING } from '@constants';

const roleLabels: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Student',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.PARENT]: 'Parent',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};

const roleColors: Record<UserRole, string> = {
  [UserRole.STUDENT]: '#3B82F6',
  [UserRole.TEACHER]: '#8B5CF6',
  [UserRole.PARENT]: '#10B981',
  [UserRole.ADMIN]: '#F59E0B',
  [UserRole.SUPER_ADMIN]: '#EF4444',
};

export const RoleBadge: React.FC = () => {
  const { activeRole, availableRoles } = useAppSelector(state => state.auth);

  if (!activeRole) {
    return null;
  }

  const badgeColor = roleColors[activeRole] || COLORS.primary;

  return (
    <View style={styles.container}>
      <Badge
        value={roleLabels[activeRole]}
        badgeStyle={[styles.badge, { backgroundColor: badgeColor }]}
        textStyle={styles.badgeText}
      />
      {availableRoles.length > 1 && (
        <View style={styles.multiRoleIndicator}>
          <Text style={styles.multiRoleText}>{availableRoles.length}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  multiRoleIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  multiRoleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
