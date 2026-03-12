import { Page } from '@playwright/test';
import { TEST_USERS } from './test-data';

export interface StoredAuthState {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Creates a mock authenticated state in localStorage
 */
export async function setAuthState(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  const authState: StoredAuthState = {
    user: {
      id: `${role}-123`,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: true,
    },
    accessToken: `mock-access-token-${role}`,
    refreshToken: `mock-refresh-token-${role}`,
  };

  await page.addInitScript((state) => {
    localStorage.setItem('auth-storage', JSON.stringify(state));
  }, authState);
}

/**
 * Clears authentication state
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
