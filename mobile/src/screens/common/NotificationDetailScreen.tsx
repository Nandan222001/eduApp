import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'NotificationDetail'>;

export const NotificationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { notificationId } = route.params;

  return (
    <View style={styles.container}>
      <Text h3>Notification Detail</Text>
      <Text>Notification ID: {notificationId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
