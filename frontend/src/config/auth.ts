export const AUTH_CONFIG = {
  session: {
    timeoutMinutes: 30,
    warningMinutes: 5,
    checkIntervalSeconds: 60,
  },
  token: {
    refreshThresholdMinutes: 5,
    storageKey: 'access_token',
    refreshStorageKey: 'refresh_token',
    expiryStorageKey: 'token_expiry',
  },
  otp: {
    length: 6,
    expiryMinutes: 10,
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  routes: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
    dashboard: '/dashboard',
    unauthorized: '/unauthorized',
  },
} as const;
