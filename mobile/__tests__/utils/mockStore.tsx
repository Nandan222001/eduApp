import React from 'react';
import { configureStore, PreloadedState, combineReducers } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import authReducer from '../../src/store/slices/authSlice';
import userReducer from '../../src/store/slices/userSlice';
import notificationReducer from '../../src/store/slices/notificationSlice';
import offlineReducer from '../../src/store/slices/offlineSlice';
import studentDataReducer from '../../src/store/slices/studentDataSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  notification: notificationReducer,
  offline: offlineReducer,
  studentData: studentDataReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

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

export const MockStoreProvider: React.FC<{
  children: React.ReactNode;
  preloadedState?: PreloadedState<RootState>;
}> = ({ children, preloadedState }) => {
  const store = createMockStore(preloadedState);
  return <Provider store={store}>{children}</Provider>;
};

export const createInitialAuthState = () => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  availableRoles: [],
  activeRole: null,
});

export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  phone: '+1234567890',
  institution_id: 1,
  role_id: 3,
  is_active: true,
  is_superuser: false,
  email_verified: true,
  last_login: new Date().toISOString(),
  permissions: ['view_profile'],
  role: {
    id: 3,
    name: 'Student',
    slug: 'student',
  },
  institution: {
    id: 1,
    name: 'Test Institution',
    slug: 'test-institution',
  },
  ...overrides,
});

export const createAuthenticatedState = (userOverrides = {}) => ({
  user: createMockUser(userOverrides),
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  availableRoles: ['student' as const],
  activeRole: 'student' as const,
});
