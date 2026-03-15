import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, padding = SPACING.md, style, ...props }) => {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
