import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Badge } from '@rneui/themed';
import { useAppSelector } from '@store/hooks';
import { COLORS, SPACING } from '@constants';

const roleLabels: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  parent: 'Parent',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const roleColors: Record<string, string> = {
  student: '#3B82F6',
  teacher: '#8B5CF6',
  parent: '#10B981',
  admin: '#F59E0B',
  super_admin: '#EF4444',
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
