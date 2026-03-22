import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, createMigrate } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import dashboardReducer from './slices/dashboardSlice';
import assignmentsReducer from './slices/assignmentsSlice';
import gradesReducer from './slices/gradesSlice';
import parentReducer from './slices/parentSlice';
import offlineReducer from './slices/offlineSlice';
import studentDataReducer from './slices/studentDataSlice';

const migrations = {
  1: (state: any) => {
    if (state?.auth) {
      const { isAuthenticated, user, accessToken, refreshToken } = state.auth;
      if (!isAuthenticated && user && accessToken && refreshToken) {
        return {
          ...state,
          auth: {
            ...state.auth,
            isAuthenticated: true,
          },
        };
      }
    }
    return state;
  },
};

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'profile', 'dashboard', 'assignments', 'grades', 'parent', 'offline', 'studentData'],
  migrate: createMigrate(migrations, { debug: false }),
};

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  dashboard: dashboardReducer,
  assignments: assignmentsReducer,
  grades: gradesReducer,
  parent: parentReducer,
  offline: offlineReducer,
  studentData: studentDataReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH, 
          REHYDRATE, 
          PAUSE, 
          PERSIST, 
          PURGE, 
          REGISTER,
          'auth/login/fulfilled',
          'auth/loadStoredAuth/fulfilled',
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
