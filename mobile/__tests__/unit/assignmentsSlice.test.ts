import { configureStore } from '@reduxjs/toolkit';
import assignmentsReducer from '../../src/store/slices/assignmentsSlice';

describe('assignmentsSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        assignments: assignmentsReducer,
      },
    });
  });

  it('should have correct initial state', () => {
    const state = store.getState().assignments;
    expect(state).toEqual({
      assignments: [],
      selectedAssignment: null,
      isLoading: false,
      error: null,
    });
  });
});
