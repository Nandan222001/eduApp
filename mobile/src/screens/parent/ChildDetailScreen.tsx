import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'ChildDetail'>;

export const ChildDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { childId } = route.params;

  return (
    <View style={styles.container}>
      <Text h3>Child Detail</Text>
      <Text>Child ID: {childId}</Text>
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
