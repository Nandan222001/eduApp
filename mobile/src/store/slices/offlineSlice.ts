import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QueuedRequest } from '@utils/offlineQueue';

interface OfflineState {
  isOnline: boolean;
  queuedOperations: QueuedRequest[];
  lastSyncTime: number | null;
  syncInProgress: boolean;
  autoSyncEnabled: boolean;
}

const initialState: OfflineState = {
  isOnline: true,
  queuedOperations: [],
  lastSyncTime: null,
  syncInProgress: false,
  autoSyncEnabled: true,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setQueuedOperations: (state, action: PayloadAction<QueuedRequest[]>) => {
      state.queuedOperations = action.payload;
    },
    addQueuedOperation: (state, action: PayloadAction<QueuedRequest>) => {
      state.queuedOperations.push(action.payload);
    },
    removeQueuedOperation: (state, action: PayloadAction<string>) => {
      state.queuedOperations = state.queuedOperations.filter(op => op.id !== action.payload);
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<number>) => {
      state.lastSyncTime = action.payload;
    },
    setAutoSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoSyncEnabled = action.payload;
    },
    clearQueue: state => {
      state.queuedOperations = [];
    },
  },
});

export const {
  setOnlineStatus,
  setQueuedOperations,
  addQueuedOperation,
  removeQueuedOperation,
  setSyncInProgress,
  setLastSyncTime,
  setAutoSyncEnabled,
  clearQueue,
} = offlineSlice.actions;

export default offlineSlice.reducer;
