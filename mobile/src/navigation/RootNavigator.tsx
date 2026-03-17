import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loadStoredAuth } from '@store/slices/authSlice';
import { Loading } from '@components';
import { RootStackParamList } from '@types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { authService } from '@utils/authService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      authService.initializeAuth();
    } else {
      authService.stopAutoRefresh();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
