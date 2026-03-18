import React from 'react';
import { GamificationScreen } from './GamificationScreen';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'Gamification'>;

export const GamificationScreenWrapper: React.FC<Props> = ({ route }) => {
  const { studentId } = route.params || {};
  
  return <GamificationScreen studentId={studentId} />;
};
