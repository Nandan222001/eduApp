import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { StudentDashboardPage } from '../../page-objects/StudentDashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle, waitForToast } from '../../utils/helpers';
import path from 'path';

test.describe('Student Login and Assignment Submission', () => {
  let loginPage: LoginPage;
  let dashboardPage: StudentDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new StudentDashboardPage(page);
  });

  test('should login as student and navigate to dashboard', async ({ page }) => {
    await loginPage.goto();
    
    await expect(page).toHaveTitle(/login/i);
    
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    
    await waitForNetworkIdle(page);
    
    await expect(page).toHaveURL(/student\/dashboard/);
    
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should display student information after login', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    
    await waitForNetworkIdle(page);
    
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.click();
    
    await expect(page.locator('text=' + TEST_USERS.student.email)).toBeVisible();
  });

  test('should view assignments list', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await dashboardPage.viewAssignments();
    
    await expect(dashboardPage.assignmentsList).toBeVisible();
    
    const assignmentsCount = await dashboardPage.assignmentsList
      .locator('.assignment-item')
      .count();
    expect(assignmentsCount).toBeGreaterThan(0);
  });

  test('should submit assignment with file upload', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await dashboardPage.viewAssignments();
    
    const testFile = path.join(__dirname, '../../fixtures/sample-assignment.pdf');
    
    await dashboardPage.submitAssignment(0, testFile);
    
    await waitForToast(page, /submitted successfully/i);
    
    const submittedBadge = page.locator('[data-testid="assignment-status"]', {
      hasText: /submitted/i,
    });
    await expect(submittedBadge.first()).toBeVisible();
  });

  test('should handle login errors gracefully', async ({ page }) => {
    await loginPage.goto();
    
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain(/invalid credentials/i);
    
    await expect(page).toHaveURL(/login/);
  });

  test('should login with OTP', async ({ page }) => {
    await loginPage.goto();
    
    await loginPage.loginWithOTP(TEST_USERS.student.email, '123456');
    
    await waitForNetworkIdle(page);
    
    await expect(page).toHaveURL(/student\/dashboard/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.goto();
    
    await loginPage.forgotPasswordLink.click();
    
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should search for assignments', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await dashboardPage.searchContent('mathematics');
    
    await expect(page).toHaveURL(/search/);
    
    const results = page.locator('[data-testid="search-results"]');
    await expect(results).toBeVisible();
  });
});
