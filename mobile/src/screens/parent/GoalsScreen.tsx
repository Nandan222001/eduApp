import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GoalsScreen as SharedGoalsScreen } from '@screens/student/GoalsScreen';
import { ParentTabScreenProps } from '@types';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

type Props = ParentTabScreenProps<'Dashboard'> & {
  childId?: number;
};

export const GoalsScreen: React.FC<Props> = ({ childId, ...props }) => {
  if (!childId) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Please select a child to view their goals</Text>
      </View>
    );
  }

  return <SharedGoalsScreen studentId={childId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
