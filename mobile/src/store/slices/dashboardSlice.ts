import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentApi } from '../../api/studentApi';
import { StudentStats, AttendanceStatus } from '../../types/student';

interface DashboardState {
  stats: StudentStats | null;
  attendance: AttendanceStatus | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  isSyncing: boolean;
}

const initialState: DashboardState = {
  stats: null,
  attendance: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isSyncing: false,
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [stats, attendance] = await Promise.all([
        studentApi.getStats(),
        studentApi.getAttendance(),
      ]);
      return { stats, attendance };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch dashboard data');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.stats = null;
      state.attendance = null;
      state.error = null;
      state.lastUpdated = null;
    },
    setLastSynced: (state, action) => {
      state.lastUpdated = new Date(action.payload).getTime();
    },
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
        state.attendance = action.payload.attendance;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboard, setLastSynced, setSyncing } = dashboardSlice.actions;
export default dashboardSlice.reducer;
