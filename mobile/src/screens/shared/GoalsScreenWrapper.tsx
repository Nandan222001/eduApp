import React from 'react';
import { GoalsScreen } from '@screens/student/GoalsScreen';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'Goals'>;

export const GoalsScreenWrapper: React.FC<Props> = ({ route }) => {
  const { studentId } = route.params || {};
  
  return <GoalsScreen studentId={studentId} />;
};
