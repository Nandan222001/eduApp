import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockStoreProvider, mockInitialState } from './mockStore';
import { MockThemeProvider } from './mockTheme';
import { PreloadedState } from '@reduxjs/toolkit';
import { RootState } from '../../src/store/store';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  queryClient?: QueryClient;
}

const AllTheProviders: React.FC<{
  children: React.ReactNode;
  preloadedState?: PreloadedState<RootState>;
  queryClient?: QueryClient;
}> = ({ children, preloadedState = mockInitialState, queryClient }) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <MockStoreProvider preloadedState={preloadedState}>
      <QueryClientProvider client={client}>
        <MockThemeProvider>
          <NavigationContainer>{children}</NavigationContainer>
        </MockThemeProvider>
      </QueryClientProvider>
    </MockStoreProvider>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { preloadedState, queryClient, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders preloadedState={preloadedState} queryClient={queryClient}>
      {children}
    </AllTheProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  });
};
