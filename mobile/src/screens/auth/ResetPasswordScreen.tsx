import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { AuthStackScreenProps } from '@types';

type Props = AuthStackScreenProps<'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token } = route.params;

  return (
    <View style={styles.container}>
      <Text h3>Reset Password Screen</Text>
      <Text>Token: {token}</Text>
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
