import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { studentApi, DashboardData } from '@api/student';
import type { Profile, AttendanceSummary, Assignment, Grade } from '../../types/student';

interface StudentDataState {
  profile: Profile | null;
  profileLastSync: number | null;
  dashboard: DashboardData | null;
  dashboardLastSync: number | null;
  assignments: Assignment[];
  assignmentsLastSync: number | null;
  grades: Grade[];
  gradesLastSync: number | null;
  attendance: AttendanceSummary | null;
  attendanceLastSync: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentDataState = {
  profile: null,
  profileLastSync: null,
  dashboard: null,
  dashboardLastSync: null,
  assignments: [],
  assignmentsLastSync: null,
  grades: [],
  gradesLastSync: null,
  attendance: null,
  attendanceLastSync: null,
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'studentData/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getProfile();
      return { data: response.data, timestamp: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'studentData/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getDashboard();
      return { data: response.data, timestamp: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard');
    }
  }
);

export const fetchAssignments = createAsyncThunk(
  'studentData/fetchAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getAssignments();
      return { data: response.data, timestamp: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assignments');
    }
  }
);

export const fetchGrades = createAsyncThunk(
  'studentData/fetchGrades',
  async (params: { term?: string; subject?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await studentApi.getGrades(params);
      return { data: response.data, timestamp: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch grades');
    }
  }
);

export const fetchAttendance = createAsyncThunk(
  'studentData/fetchAttendance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getAttendanceSummary();
      return { data: response.data, timestamp: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch attendance');
    }
  }
);

const studentDataSlice = createSlice({
  name: 'studentData',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    updateProfileOptimistic: (state, action: PayloadAction<Partial<Profile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    addAssignmentOptimistic: (state, action: PayloadAction<Assignment>) => {
      state.assignments.unshift(action.payload);
    },
    updateAssignmentOptimistic: (
      state,
      action: PayloadAction<{ id: number; updates: Partial<Assignment> }>
    ) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.assignments[index] = { ...state.assignments[index], ...action.payload.updates };
      }
    },
    clearAllData: state => {
      state.profile = null;
      state.profileLastSync = null;
      state.dashboard = null;
      state.dashboardLastSync = null;
      state.assignments = [];
      state.assignmentsLastSync = null;
      state.grades = [];
      state.gradesLastSync = null;
      state.attendance = null;
      state.attendanceLastSync = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.data;
        state.profileLastSync = action.payload.timestamp;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDashboard.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload.data;
        state.dashboardLastSync = action.payload.timestamp;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignments.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assignments = action.payload.data;
        state.assignmentsLastSync = action.payload.timestamp;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchGrades.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload.data;
        state.gradesLastSync = action.payload.timestamp;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAttendance.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendance = action.payload.data;
        state.attendanceLastSync = action.payload.timestamp;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateProfileOptimistic,
  addAssignmentOptimistic,
  updateAssignmentOptimistic,
  clearAllData,
} = studentDataSlice.actions;

export default studentDataSlice.reducer;
