import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentApi } from '../../api/studentApi';
import { Grade } from '../../types/student';

interface GradesState {
  grades: Grade[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: GradesState = {
  grades: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const fetchGrades = createAsyncThunk(
  'grades/fetch',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      const grades = await studentApi.getGrades(limit);
      return grades;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch grades');
    }
  }
);

const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    clearGrades: (state) => {
      state.grades = [];
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGrades } = gradesSlice.actions;
export default gradesSlice.reducer;
