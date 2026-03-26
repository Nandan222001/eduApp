import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { QueuedRequest } from '@utils/offlineQueue';

interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  queuedOperations: QueuedRequest[];
  pendingActions: PendingAction[];
  lastSyncTime: number | null;
  syncInProgress: boolean;
  autoSyncEnabled: boolean;
}

const initialState: OfflineState = {
  isOnline: true,
  queuedOperations: [],
  pendingActions: [],
  lastSyncTime: null,
  syncInProgress: false,
  autoSyncEnabled: true,
};

export const syncPendingActions = createAsyncThunk(
  'offline/syncPendingActions',
  async (_, { getState, dispatch }) => {
    const state = getState() as { offline: OfflineState };
    const { pendingActions, isOnline } = state.offline;

    if (!isOnline || pendingActions.length === 0) {
      return { synced: 0, failed: 0 };
    }

    dispatch(setSyncInProgress(true));
    
    let syncedCount = 0;
    let failedCount = 0;

    for (const action of pendingActions) {
      try {
        // Here you would dispatch the actual action or make the API call
        // For now, we'll just mark it as synced
        dispatch(removePendingAction(action.id));
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failedCount++;
      }
    }

    dispatch(setSyncInProgress(false));
    dispatch(setLastSyncTime(Date.now()));

    return { synced: syncedCount, failed: failedCount };
  }
);

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
    addPendingAction: (state, action: PayloadAction<PendingAction>) => {
      state.pendingActions.push(action.payload);
    },
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(a => a.id !== action.payload);
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
    clearPendingActions: state => {
      state.pendingActions = [];
    },
  },
});

export const {
  setOnlineStatus,
  setQueuedOperations,
  addQueuedOperation,
  removeQueuedOperation,
  addPendingAction,
  removePendingAction,
  setSyncInProgress,
  setLastSyncTime,
  setAutoSyncEnabled,
  clearQueue,
  clearPendingActions,
} = offlineSlice.actions;

export default offlineSlice.reducer;
