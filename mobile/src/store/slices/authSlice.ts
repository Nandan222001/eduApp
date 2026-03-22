import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import { secureStorage } from '../../utils/secureStorage';
import { biometricUtils } from '../../utils/biometric';
import {
  AuthState,
  User,
  LoginRequest,
  OTPLoginRequest,
  OTPVerifyRequest,
  UserRole,
} from '../../types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  activeRole: null,
  availableRoles: [],
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const tokenResponse = await authApi.login(credentials);
      await secureStorage.setTokens(tokenResponse.access_token, tokenResponse.refresh_token);

      const user = await authApi.getCurrentUser();
      await secureStorage.setUserEmail(user.email);

      const isDemoUser = 
        (credentials.email === 'demo@example.com' && credentials.password === 'Demo@123') ||
        (credentials.email === 'parent@demo.com' && credentials.password === 'Demo@123');
      await secureStorage.setIsDemoUser(isDemoUser);

      return {
        user,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Login failed');
    }
  }
);

export const requestOTP = createAsyncThunk(
  'auth/requestOTP',
  async (data: OTPLoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.requestOTP(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to send OTP');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (data: OTPVerifyRequest, { rejectWithValue }) => {
    try {
      const tokenResponse = await authApi.verifyOTP(data);
      await secureStorage.setTokens(tokenResponse.access_token, tokenResponse.refresh_token);

      const user = await authApi.getCurrentUser();
      await secureStorage.setUserEmail(user.email);

      return {
        user,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'OTP verification failed');
    }
  }
);

export const loginWithBiometric = createAsyncThunk(
  'auth/loginWithBiometric',
  async (_, { rejectWithValue }) => {
    try {
      const isAvailable = await biometricUtils.isAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const biometricType = await biometricUtils.getBiometricType();
      const authResult = await biometricUtils.authenticate({
        promptMessage: `Use ${biometricType} to login`,
      });

      if (!authResult.success) {
        throw new Error(authResult.error || 'Biometric authentication failed');
      }

      const accessToken = await secureStorage.getAccessToken();
      const refreshToken = await secureStorage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        throw new Error('No stored credentials found');
      }

      const user = await authApi.getCurrentUser();

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Biometric login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as { auth: AuthState };
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      await authApi.logout(refreshToken);
    }

    await secureStorage.clearAll();

    return null;
  } catch (error: any) {
    await secureStorage.clearAll();
    return rejectWithValue(error.response?.data?.detail || 'Logout failed');
  }
});

export const loadStoredAuth = createAsyncThunk('auth/loadStoredAuth', async (_, { rejectWithValue }) => {
  try {
    const accessToken = await secureStorage.getAccessToken();
    const refreshToken = await secureStorage.getRefreshToken();
    const biometricEnabled = await secureStorage.getBiometricEnabled();
    const isDemoUser = await secureStorage.getIsDemoUser();

    if (!accessToken || !refreshToken) {
      return null;
    }

    const user = await authApi.getCurrentUser();

    if (isDemoUser) {
      await secureStorage.setIsDemoUser(true);
    }

    return {
      user,
      accessToken,
      refreshToken,
      biometricEnabled,
    };
  } catch (error: any) {
    await secureStorage.clearTokens();
    return rejectWithValue(error.response?.data?.detail || 'Failed to restore session');
  }
});

export const enableBiometric = createAsyncThunk('auth/enableBiometric', async (_, { rejectWithValue }) => {
  try {
    const isAvailable = await biometricUtils.isAvailable();
    if (!isAvailable) {
      throw new Error('Biometric authentication not available on this device');
    }

    const biometricType = await biometricUtils.getBiometricType();
    const authResult = await biometricUtils.authenticate({
      promptMessage: `Enable ${biometricType} for quick login`,
    });

    if (!authResult.success) {
      throw new Error(authResult.error || 'Biometric authentication failed');
    }

    await secureStorage.setBiometricEnabled(true);
    return true;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to enable biometric');
  }
});

export const disableBiometric = createAsyncThunk('auth/disableBiometric', async () => {
  await secureStorage.setBiometricEnabled(false);
  return false;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setActiveRole: (state, action: PayloadAction<string>) => {
      state.activeRole = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        // Set activeRole based on user's role
        if (action.payload.user.roleInfo?.slug) {
          state.activeRole = action.payload.user.roleInfo.slug;
          state.availableRoles = [action.payload.user.roleInfo.slug];
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(requestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        // Set activeRole based on user's role
        if (action.payload.user.roleInfo?.slug) {
          state.activeRole = action.payload.user.roleInfo.slug;
          state.availableRoles = [action.payload.user.roleInfo.slug];
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(loginWithBiometric.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithBiometric.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        // Set activeRole based on user's role
        if (action.payload.user.roleInfo?.slug) {
          state.activeRole = action.payload.user.roleInfo.slug;
          state.availableRoles = [action.payload.user.roleInfo.slug];
        }
      })
      .addCase(loginWithBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.activeRole = null;
        state.availableRoles = [];
      })
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.biometricEnabled = action.payload.biometricEnabled;
          // Set activeRole based on user's role
          if (action.payload.user.roleInfo?.slug) {
            state.activeRole = action.payload.user.roleInfo.slug;
            state.availableRoles = [action.payload.user.roleInfo.slug];
          }
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      })
      .addCase(disableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      });
  },
});

export const { clearError, setUser, setActiveRole } = authSlice.actions;
export default authSlice.reducer;
