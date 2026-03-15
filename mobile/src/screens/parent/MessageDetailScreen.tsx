import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'MessageDetail'>;

export const MessageDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { messageId } = route.params;

  return (
    <View style={styles.container}>
      <Text h3>Message Detail</Text>
      <Text>Message ID: {messageId}</Text>
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
