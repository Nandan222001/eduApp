import React, { lazy, Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

// Lazy load the heavy AI predictions screen
const AIPredictionsScreenImpl = lazy(() => import('../../../src/screens/student/AIPredictionsScreen'));

const LoadingFallback = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Loading AI predictions...</Text>
  </View>
);

export default function AIPredictionsScreen() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AIPredictionsScreenImpl />
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
