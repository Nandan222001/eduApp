import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import studentDataReducer from './slices/studentDataSlice';
import offlineReducer from './slices/offlineSlice';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'studentData', 'offline'],
  blacklist: ['user', 'notification'],
};

const studentDataPersistConfig = {
  key: 'studentData',
  storage: AsyncStorage,
  whitelist: [
    'profile',
    'profileLastSync',
    'dashboard',
    'dashboardLastSync',
    'assignments',
    'assignmentsLastSync',
    'grades',
    'gradesLastSync',
    'attendance',
    'attendanceLastSync',
  ],
};

const offlinePersistConfig = {
  key: 'offline',
  storage: AsyncStorage,
  whitelist: ['queuedOperations', 'pendingActions', 'lastSyncTime', 'autoSyncEnabled'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  notification: notificationReducer,
  studentData: persistReducer(studentDataPersistConfig, studentDataReducer),
  offline: persistReducer(offlinePersistConfig, offlineReducer),
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
