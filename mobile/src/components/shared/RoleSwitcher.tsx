import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text, Icon, Divider } from '@rneui/themed';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setActiveRole } from '@store/slices/authSlice';
import { UserRole } from '@types';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants';

interface RoleSwitcherProps {
  showLabel?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Student',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.PARENT]: 'Parent',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};

const roleIcons: Record<UserRole, { name: string; type: string }> = {
  [UserRole.STUDENT]: { name: 'school', type: 'material' },
  [UserRole.TEACHER]: { name: 'person', type: 'material' },
  [UserRole.PARENT]: { name: 'people', type: 'material' },
  [UserRole.ADMIN]: { name: 'admin-panel-settings', type: 'material' },
  [UserRole.SUPER_ADMIN]: { name: 'supervised-user-circle', type: 'material' },
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ showLabel = true }) => {
  const dispatch = useAppDispatch();
  const { availableRoles, activeRole } = useAppSelector(state => state.auth);
  const [modalVisible, setModalVisible] = useState(false);

  if (availableRoles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = (role: UserRole) => {
    dispatch(setActiveRole(role));
    setModalVisible(false);
  };

  const currentRoleIcon = activeRole ? roleIcons[activeRole] : roleIcons[UserRole.STUDENT];
  const currentRoleLabel = activeRole ? roleLabels[activeRole] : '';

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setModalVisible(true)}>
        <View style={styles.content}>
          <Icon
            name={currentRoleIcon.name}
            type={currentRoleIcon.type}
            size={20}
            color={COLORS.primary}
          />
          {showLabel && <Text style={styles.label}>{currentRoleLabel}</Text>}
          <Icon name="expand-more" type="material" size={18} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Role</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" type="material" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Divider />
            <ScrollView style={styles.roleList}>
              {availableRoles.map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleItem, activeRole === role && styles.roleItemActive]}
                  onPress={() => handleRoleSwitch(role)}
                >
                  <View style={styles.roleItemContent}>
                    <Icon
                      name={roleIcons[role].name}
                      type={roleIcons[role].type}
                      size={24}
                      color={activeRole === role ? COLORS.primary : COLORS.text}
                    />
                    <Text
                      style={[
                        styles.roleItemText,
                        activeRole === role && styles.roleItemTextActive,
                      ]}
                    >
                      {roleLabels[role]}
                    </Text>
                  </View>
                  {activeRole === role && (
                    <Icon name="check" type="material" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roleList: {
    maxHeight: 300,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roleItemActive: {
    backgroundColor: COLORS.surface,
  },
  roleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  roleItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  roleItemTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});
