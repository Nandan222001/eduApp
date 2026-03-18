import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@rneui/themed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from '@store';
import { RootNavigator } from '@navigation';
import { Loading } from '@components';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { theme } from '@config/theme';
import { initializeSentry } from '@config/sentry';
import { analyticsService } from '@services/analytics';

initializeSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      analyticsService.trackAppLaunchTime();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <SafeAreaProvider>
                <RootNavigator />
                <StatusBar style="auto" />
              </SafeAreaProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
