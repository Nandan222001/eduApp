import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfflineIndicator } from './OfflineIndicator';
import { COLORS } from '@constants';
import { offlineQueueManager } from '@utils/offlineQueue';

interface ScreenLayoutProps {
  children: React.ReactNode;
  showOfflineIndicator?: boolean;
  style?: ViewStyle;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  showOfflineIndicator = true,
  style,
}) => {
  const handleSyncPress = async () => {
    await offlineQueueManager.syncQueue();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {showOfflineIndicator && <OfflineIndicator onSyncPress={handleSyncPress} />}
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
