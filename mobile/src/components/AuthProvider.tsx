import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppDispatch } from '@store/hooks';
import { loadStoredAuth } from '@store/slices/authSlice';
import { authService } from '@utils/authService';
import { COLORS } from '@constants';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeAuth();

    return () => {
      authService.stopAutoRefresh();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      await dispatch(loadStoredAuth()).unwrap();
      await authService.initializeAuth();
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
