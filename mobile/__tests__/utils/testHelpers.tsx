import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import { MockStoreProvider, RootState } from './mockStore';
import { PreloadedState } from '@reduxjs/toolkit';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState,
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockStoreProvider preloadedState={preloadedState}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NavigationContainer>{children}</NavigationContainer>
        </ThemeProvider>
      </QueryClientProvider>
    </MockStoreProvider>
  );

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
};

export const renderWithStore = (
  ui: React.ReactElement,
  { preloadedState, ...renderOptions }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockStoreProvider preloadedState={preloadedState}>
      <ThemeProvider>{children}</ThemeProvider>
    </MockStoreProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export const renderWithNavigation = (ui: React.ReactElement, renderOptions: RenderOptions = {}) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NavigationContainer>
      <ThemeProvider>{children}</ThemeProvider>
    </NavigationContainer>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0));

export * from '@testing-library/react-native';
export { renderWithProviders as render };
