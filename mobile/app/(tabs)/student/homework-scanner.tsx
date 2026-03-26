import React, { lazy, Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

// Lazy load the heavy homework scanner screen with camera functionality
const HomeworkScannerScreenImpl = lazy(() => import('../../../src/screens/student/HomeworkScannerScreen'));

const LoadingFallback = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Loading homework scanner...</Text>
  </View>
);

export default function SmartHomeworkScannerScreen() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeworkScannerScreenImpl />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
