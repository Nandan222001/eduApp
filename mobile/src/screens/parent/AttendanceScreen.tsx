import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { ParentTabScreenProps } from '@types';

type Props = ParentTabScreenProps<'Attendance'>;

export const AttendanceScreen: React.FC<Props> = ({ navigation, route }) => {
  const childId = route.params?.childId;

  return (
    <View style={styles.container}>
      <Text h3>Attendance</Text>
      {childId && <Text>Child ID: {childId}</Text>}
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
