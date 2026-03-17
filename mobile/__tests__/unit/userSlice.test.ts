import userReducer, {
  setProfile,
  updateProfile,
  setLoading,
  setError,
  clearError,
} from '../../src/store/slices/userSlice';
import { createMockUser } from '../utils';

describe('userSlice', () => {
  const initialState = {
    profile: null,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = userReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    describe('setProfile', () => {
      it('should set user profile', () => {
        const user = createMockUser();
        const state = userReducer(initialState, setProfile(user));
        expect(state.profile).toEqual(user);
      });

      it('should set profile to null', () => {
        const stateWithProfile = {
          ...initialState,
          profile: createMockUser(),
        };
        const state = userReducer(stateWithProfile, setProfile(null));
        expect(state.profile).toBeNull();
      });

      it('should replace existing profile', () => {
        const oldUser = createMockUser({ first_name: 'Old' });
        const newUser = createMockUser({ first_name: 'New' });
        const stateWithProfile = {
          ...initialState,
          profile: oldUser,
        };
        const state = userReducer(stateWithProfile, setProfile(newUser));
        expect(state.profile).toEqual(newUser);
        expect(state.profile?.first_name).toBe('New');
      });
    });

    describe('updateProfile', () => {
      it('should update partial profile data', () => {
        const user = createMockUser({
          first_name: 'Original',
          last_name: 'User',
        });
        const stateWithProfile = {
          ...initialState,
          profile: user,
        };
        const updates = { first_name: 'Updated' };
        const state = userReducer(stateWithProfile, updateProfile(updates));

        expect(state.profile?.first_name).toBe('Updated');
        expect(state.profile?.last_name).toBe('User');
      });

      it('should not update if profile is null', () => {
        const state = userReducer(initialState, updateProfile({ first_name: 'Updated' }));
        expect(state.profile).toBeNull();
      });

      it('should update multiple fields', () => {
        const user = createMockUser();
        const stateWithProfile = {
          ...initialState,
          profile: user,
        };
        const updates = {
          first_name: 'NewFirst',
          last_name: 'NewLast',
          phone_number: '1234567890',
        };
        const state = userReducer(stateWithProfile, updateProfile(updates));

        expect(state.profile?.first_name).toBe('NewFirst');
        expect(state.profile?.last_name).toBe('NewLast');
        expect(state.profile?.phone_number).toBe('1234567890');
      });

      it('should preserve unmodified fields', () => {
        const user = createMockUser({
          email: 'original@example.com',
          first_name: 'Original',
        });
        const stateWithProfile = {
          ...initialState,
          profile: user,
        };
        const state = userReducer(stateWithProfile, updateProfile({ first_name: 'Updated' }));

        expect(state.profile?.email).toBe('original@example.com');
        expect(state.profile?.id).toBe(user.id);
      });
    });

    describe('setLoading', () => {
      it('should set loading to true', () => {
        const state = userReducer(initialState, setLoading(true));
        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState = {
          ...initialState,
          isLoading: true,
        };
        const state = userReducer(loadingState, setLoading(false));
        expect(state.isLoading).toBe(false);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const errorMessage = 'Something went wrong';
        const state = userReducer(initialState, setError(errorMessage));
        expect(state.error).toBe(errorMessage);
      });

      it('should set error to null', () => {
        const errorState = {
          ...initialState,
          error: 'Previous error',
        };
        const state = userReducer(errorState, setError(null));
        expect(state.error).toBeNull();
      });

      it('should replace existing error', () => {
        const errorState = {
          ...initialState,
          error: 'Old error',
        };
        const state = userReducer(errorState, setError('New error'));
        expect(state.error).toBe('New error');
      });
    });

    describe('clearError', () => {
      it('should clear error message', () => {
        const errorState = {
          ...initialState,
          error: 'Test error',
        };
        const state = userReducer(errorState, clearError());
        expect(state.error).toBeNull();
      });

      it('should not affect other state properties', () => {
        const user = createMockUser();
        const errorState = {
          profile: user,
          isLoading: true,
          error: 'Test error',
        };
        const state = userReducer(errorState, clearError());
        expect(state.error).toBeNull();
        expect(state.profile).toEqual(user);
        expect(state.isLoading).toBe(true);
      });
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state when setting profile', () => {
      const originalState = { ...initialState };
      const user = createMockUser();
      userReducer(originalState, setProfile(user));
      expect(originalState).toEqual(initialState);
    });

    it('should not mutate original state when updating profile', () => {
      const user = createMockUser();
      const originalState = {
        ...initialState,
        profile: user,
      };
      const originalUser = { ...user };
      userReducer(originalState, updateProfile({ first_name: 'Updated' }));
      expect(originalState.profile).toEqual(originalUser);
    });
  });

  describe('edge cases', () => {
    it('should handle empty update object', () => {
      const user = createMockUser();
      const stateWithProfile = {
        ...initialState,
        profile: user,
      };
      const state = userReducer(stateWithProfile, updateProfile({}));
      expect(state.profile).toEqual(user);
    });

    it('should handle multiple actions in sequence', () => {
      let state = initialState;
      const user = createMockUser();

      state = userReducer(state, setProfile(user));
      state = userReducer(state, setLoading(true));
      state = userReducer(state, updateProfile({ first_name: 'Updated' }));
      state = userReducer(state, setError('Test error'));

      expect(state.profile?.first_name).toBe('Updated');
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe('Test error');
    });
  });
});
