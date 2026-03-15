import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { ParentTabScreenProps } from '@types';

type Props = ParentTabScreenProps<'Messages'>;

export const MessagesScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text h3>Messages</Text>
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
