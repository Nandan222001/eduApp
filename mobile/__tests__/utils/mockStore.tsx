import React from 'react';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import authReducer from '../../src/store/slices/authSlice';
import userReducer from '../../src/store/slices/userSlice';
import notificationReducer from '../../src/store/slices/notificationSlice';
import dashboardReducer from '../../src/store/slices/dashboardSlice';
import assignmentsReducer from '../../src/store/slices/assignmentsSlice';
import gradesReducer from '../../src/store/slices/gradesSlice';
import attendanceReducer from '../../src/store/slices/attendanceSlice';
import { RootState } from '../../src/store/store';

export const rootReducer = {
  auth: authReducer,
  user: userReducer,
  notification: notificationReducer,
  dashboard: dashboardReducer,
  assignments: assignmentsReducer,
  grades: gradesReducer,
  attendance: attendanceReducer,
};

export const createMockStore = (preloadedState?: PreloadedState<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

interface MockStoreProviderProps {
  children: React.ReactNode;
  preloadedState?: PreloadedState<RootState>;
}

export const MockStoreProvider: React.FC<MockStoreProviderProps> = ({
  children,
  preloadedState,
}) => {
  const store = createMockStore(preloadedState);
  return <Provider store={store}>{children}</Provider>;
};

export const mockAuthState = {
  user: {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'student' as const,
    roles: ['student' as const],
    avatar: null,
    phone: '1234567890',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  availableRoles: ['student' as const],
  activeRole: 'student' as const,
};

export const mockInitialState: PreloadedState<RootState> = {
  auth: mockAuthState,
  user: {
    profile: null,
    isLoading: false,
    error: null,
  },
  notification: {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  },
  dashboard: {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  assignments: {
    assignments: [],
    selectedAssignment: null,
    isLoading: false,
    error: null,
  },
  grades: {
    grades: [],
    isLoading: false,
    error: null,
  },
  attendance: {
    attendance: [],
    summary: null,
    isLoading: false,
    error: null,
  },
};
