import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '@types';
import { authApi, LoginRequest } from '@api/auth';
import { secureStorage } from '@utils/secureStorage';
import { authService } from '@utils/authService';
import { STORAGE_KEYS } from '@constants';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  availableRoles: UserRole[];
  activeRole: UserRole | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  availableRoles: [],
  activeRole: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      const { user, access_token, refresh_token } = response.data;

      await authService.saveSession(access_token, refresh_token, user);

      return { user, accessToken: access_token, refreshToken: refresh_token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
  } catch (error: any) {
    console.error('Logout error:', error);
  } finally {
    await authService.clearSession();
  }
  return;
});

export const refreshTokens = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(refreshToken);
      const { access_token, refresh_token } = response.data;

      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

      return { accessToken: access_token, refreshToken: refresh_token };
    } catch (error: any) {
      await authService.clearSession();
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const user = await secureStorage.getObject<User>(STORAGE_KEYS.USER_DATA);
      const biometricEnabledStr = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      const biometricEnabled = biometricEnabledStr === 'true';
      const storedActiveRole = await secureStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);

      if (accessToken && refreshToken && user) {
        await authService.checkAndRefreshIfNeeded();
        const activeRole = (storedActiveRole as UserRole) || user.role;
        return { user, accessToken, refreshToken, biometricEnabled, activeRole };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load stored auth');
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      await secureStorage.setObject(STORAGE_KEYS.BIOMETRIC_CREDENTIALS, {
        email,
        password,
      });
      await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to enable biometric');
    }
  }
);

export const disableBiometric = createAsyncThunk(
  'auth/disableBiometric',
  async (_, { rejectWithValue }) => {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_CREDENTIALS);
      await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
      return false;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disable biometric');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      if (action.payload) {
        state.availableRoles = action.payload.roles || [action.payload.role];
        state.activeRole = state.activeRole || action.payload.role;
      } else {
        state.availableRoles = [];
        state.activeRole = null;
      }
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearError: state => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (action.payload.roles) {
          state.availableRoles = action.payload.roles;
        }
      }
    },
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      if (state.availableRoles.includes(action.payload)) {
        state.activeRole = action.payload;
        secureStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, action.payload);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.availableRoles = action.payload.user.roles || [action.payload.user.role];
        state.activeRole = action.payload.user.role;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        state.biometricEnabled = false;
        state.availableRoles = [];
        state.activeRole = null;
      })
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshTokens.rejected, state => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.biometricEnabled = false;
        state.availableRoles = [];
        state.activeRole = null;
      })
      .addCase(loadStoredAuth.pending, state => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
          state.biometricEnabled = action.payload.biometricEnabled;
          state.availableRoles = action.payload.user.roles || [action.payload.user.role];
          state.activeRole = action.payload.activeRole;
        }
      })
      .addCase(loadStoredAuth.rejected, state => {
        state.isLoading = false;
      })
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      })
      .addCase(disableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      });
  },
});

export const { setUser, setTokens, clearError, updateUser, setActiveRole } = authSlice.actions;
export default authSlice.reducer;
