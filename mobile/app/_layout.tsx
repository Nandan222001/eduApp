import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@rneui/themed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store, persistor } from '@store';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loadStoredAuth } from '@store/slices/authSlice';
import { Loading, OfflineDataRefresher } from '@components';
import { theme } from '@config/theme';
import { authService } from '@utils/authService';
import { initializeOfflineSupport } from '@utils/offlineInit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
    initializeOfflineSupport();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      authService.initializeAuth();
    } else {
      authService.stopAutoRefresh();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/student');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <OfflineDataRefresher autoRefresh={true} refreshIntervalMinutes={15}>
      <Slot />
    </OfflineDataRefresher>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <SafeAreaProvider>
              <RootLayoutNav />
              <StatusBar style="auto" />
            </SafeAreaProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
