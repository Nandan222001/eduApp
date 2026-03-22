import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { studentApi } from '../../api/studentApi';
import { Assignment, AssignmentSubmission } from '../../types/student';

interface AssignmentsState {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: AssignmentsState = {
  assignments: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const fetchAssignments = createAsyncThunk(
  'assignments/fetch',
  async (status: 'pending' | 'submitted' | 'graded' | undefined, { rejectWithValue }) => {
    try {
      const assignments = await studentApi.getAssignments(status);
      return assignments;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch assignments');
    }
  }
);

export const submitAssignment = createAsyncThunk(
  'assignments/submit',
  async (submission: AssignmentSubmission, { rejectWithValue, dispatch }) => {
    try {
      await studentApi.submitAssignment(submission);
      dispatch(fetchAssignments(undefined));
      return submission.assignment_id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to submit assignment');
    }
  }
);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    clearAssignments: (state) => {
      state.assignments = [];
      state.error = null;
      state.lastUpdated = null;
    },
    updateAssignmentStatus: (state, action: PayloadAction<{ id: number; status: Assignment['status'] }>) => {
      const assignment = state.assignments.find(a => a.id === action.payload.id);
      if (assignment) {
        assignment.status = action.payload.status;
      }
    },
    optimisticUpdateAssignment: (state, action: PayloadAction<{ id: number; updates: Partial<Assignment> }>) => {
      const assignment = state.assignments.find(a => a.id === action.payload.id);
      if (assignment) {
        Object.assign(assignment, action.payload.updates);
      }
    },
    rollbackAssignment: (state, action: PayloadAction<Assignment>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.assignments[index] = action.payload;
      }
    },
    setLastSynced: (state, action: PayloadAction<string>) => {
      state.lastUpdated = new Date(action.payload).getTime();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assignments = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(submitAssignment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitAssignment.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearAssignments, 
  updateAssignmentStatus,
  optimisticUpdateAssignment,
  rollbackAssignment,
  setLastSynced,
} = assignmentsSlice.actions;
export default assignmentsSlice.reducer;
