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
  first_name: 'Test',
  last_name: 'User',
  role: 'student' as const,
  roles: ['student' as const],
  profile_picture: null,
  phone_number: null,
  date_of_birth: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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
