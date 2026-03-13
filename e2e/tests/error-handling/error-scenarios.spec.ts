import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { StudentDashboardPage } from '../../page-objects/StudentDashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { mockApiFailure, mockSlowNetwork } from '../../utils/api-mocks';
import { waitForNetworkIdle, waitForToast } from '../../utils/helpers';

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await mockApiFailure(page, '/api/assignments', 500);
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const dashboardPage = new StudentDashboardPage(page);
    await dashboardPage.viewAssignments();
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/error|failed/i);
  });

  test('should show loading state during slow network', async ({ page }) => {
    await mockSlowNetwork(page);
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const loadingIndicator = page.locator('[data-testid="loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 500 });
  });

  test('should handle 401 unauthorized error', async ({ page }) => {
    await mockApiFailure(page, '/api/auth', 401);
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('unauthorized@test.com', 'wrongpassword');
    
    await expect(page).toHaveURL(/login/);
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should handle 403 forbidden error', async ({ page }) => {
    await mockApiFailure(page, '/api/admin', 403);
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await page.goto('/admin/dashboard');
    
    await expect(page).toHaveURL(/unauthorized|403/);
  });

  test('should handle 404 not found error', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    
    const errorHeading = page.locator('h1');
    await expect(errorHeading).toContainText(/404|not found/i);
  });

  test('should retry failed requests', async ({ page }) => {
    let attemptCount = 0;
    
    await page.route('**/api/assignments', async (route) => {
      attemptCount++;
      
      if (attemptCount < 2) {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      } else {
        await route.continue();
      }
    });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const dashboardPage = new StudentDashboardPage(page);
    await dashboardPage.viewAssignments();
    
    expect(attemptCount).toBeGreaterThan(1);
  });

  test('should handle session timeout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.reload();
    
    await expect(page).toHaveURL(/login/);
  });

  test('should handle file upload errors', async ({ page }) => {
    await page.route('**/api/assignments/*/submit', async (route) => {
      await route.fulfill({
        status: 413,
        body: JSON.stringify({ error: 'File too large' }),
      });
    });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const dashboardPage = new StudentDashboardPage(page);
    await dashboardPage.viewAssignments();
    
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should display offline indicator when network is down', async ({ page, context }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await context.setOffline(true);
    
    await page.reload().catch(() => {});
    
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should validate form inputs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.loginButton.click();
    
    const emailError = page.locator('[data-testid="email-error"]');
    const passwordError = page.locator('[data-testid="password-error"]');
    
    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });

  test('should handle concurrent requests', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await Promise.all([
      page.goto('/student/assignments'),
      page.goto('/student/analytics'),
      page.goto('/student/ai-prediction'),
    ]);
    
    await expect(page).toHaveURL(/student/);
  });
});
