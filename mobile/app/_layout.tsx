import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@rneui/themed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { store, persistor } from '@store';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loadStoredAuth } from '@store/slices/authSlice';
import { Loading, OfflineDataRefresher } from '@components';
import { theme } from '@config/theme';
import { authService } from '@utils/authService';
import { initializeOfflineSupport } from '@utils/offlineInit';
import { initializeIOSPlatform, checkIOSCompatibility } from '@utils/iosInit';

// Prevent splash screen from auto-hiding (only on native platforms)
if (Platform.OS !== 'web') {
  const SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync();
}

// Check iOS compatibility on iOS devices (will run on app init)
// checkIOSCompatibility is called in the useEffect hook below

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
  const { isAuthenticated, isLoading, activeRole } = useAppSelector(state => state.auth);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize platform-specific features first
        if (Platform.OS === 'ios') {
          await checkIOSCompatibility();
          await initializeIOSPlatform();
        } else if (Platform.OS === 'android') {
          const { checkAndroidCompatibility, initializeAndroidPlatform } = await import('@utils/androidInit');
          await checkAndroidCompatibility();
          await initializeAndroidPlatform();
        }

        // Load stored authentication
        await dispatch(loadStoredAuth()).unwrap();
        
        // Initialize offline support on native platforms
        if (Platform.OS !== 'web') {
          await initializeOfflineSupport();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        // Hide splash screen after initialization
        if (Platform.OS !== 'web') {
          const SplashScreen = require('expo-splash-screen');
          await SplashScreen.hideAsync();
        }
      }
    };

    initApp();
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
      if (activeRole === 'parent') {
        router.replace('/(tabs)/parent');
      } else if (activeRole === 'student') {
        router.replace('/(tabs)/student');
      } else if (activeRole) {
        router.replace('/(tabs)/student');
      } else {
        router.replace('/(tabs)/student');
      }
    }
  }, [isAuthenticated, activeRole, segments, isLoading, router]);

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
