import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'AssignmentDetail'>;

export const AssignmentDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { assignmentId } = route.params;

  return (
    <View style={styles.container}>
      <Text h3>Assignment Detail</Text>
      <Text>Assignment ID: {assignmentId}</Text>
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
