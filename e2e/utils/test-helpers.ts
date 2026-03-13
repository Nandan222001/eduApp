import { Page, test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { TEST_USERS } from '../fixtures/test-data';
import { waitForNetworkIdle } from './helpers';

type UserRole = keyof typeof TEST_USERS;

export const test = base.extend<{
  loginAs: (role: UserRole) => Promise<void>;
  authenticatedPage: Page;
}>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (role: UserRole) => {
      const loginPage = new LoginPage(page);
      const user = TEST_USERS[role];
      
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
      await waitForNetworkIdle(page);
    };
    
    await use(loginAs);
  },

  authenticatedPage: async ({ page, loginAs }, use) => {
    await loginAs('student');
    await use(page);
  },
});

export { expect } from '@playwright/test';
