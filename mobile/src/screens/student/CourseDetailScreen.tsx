import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'CourseDetail'>;

export const CourseDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { courseId } = route.params;

  return (
    <View style={styles.container}>
      <Text h3>Course Detail</Text>
      <Text>Course ID: {courseId}</Text>
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
