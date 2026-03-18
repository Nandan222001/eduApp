import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button, Icon } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';

interface NotificationPermissionModalProps {
  visible: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onRequestPermission,
  onDismiss,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Icon name="notifications-active" type="material" color={COLORS.primary} size={64} />
          </View>

          <Text style={styles.title}>Enable Notifications</Text>

          <Text style={styles.description}>Stay updated with important information about:</Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Icon
                name="assignment"
                type="material"
                color={COLORS.primary}
                size={20}
                containerStyle={styles.featureIcon}
              />
              <Text style={styles.featureText}>New assignments and deadlines</Text>
            </View>

            <View style={styles.featureItem}>
              <Icon
                name="grade"
                type="material"
                color={COLORS.success}
                size={20}
                containerStyle={styles.featureIcon}
              />
              <Text style={styles.featureText}>Grade updates and results</Text>
            </View>

            <View style={styles.featureItem}>
              <Icon
                name="event-available"
                type="material"
                color={COLORS.warning}
                size={20}
                containerStyle={styles.featureIcon}
              />
              <Text style={styles.featureText}>Attendance alerts</Text>
            </View>

            <View style={styles.featureItem}>
              <Icon
                name="campaign"
                type="material"
                color={COLORS.info}
                size={20}
                containerStyle={styles.featureIcon}
              />
              <Text style={styles.featureText}>Important announcements</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Enable Notifications"
              onPress={onRequestPermission}
              buttonStyle={styles.primaryButton}
              containerStyle={styles.primaryButtonContainer}
            />

            <Button
              title="Not Now"
              onPress={onDismiss}
              type="clear"
              titleStyle={styles.secondaryButtonTitle}
              containerStyle={styles.secondaryButtonContainer}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  featureList: {
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureIcon: {
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  primaryButtonContainer: {
    marginBottom: SPACING.sm,
  },
  secondaryButtonTitle: {
    color: COLORS.textSecondary,
  },
  secondaryButtonContainer: {
    marginTop: SPACING.xs,
  },
});
