import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { StudentDashboardPage } from '../../page-objects/StudentDashboardPage';
import { TeacherDashboardPage } from '../../page-objects/TeacherDashboardPage';
import { ParentDashboardPage } from '../../page-objects/ParentDashboardPage';
import { AdminDashboardPage } from '../../page-objects/AdminDashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle, waitForStable } from '../../utils/helpers';

test.describe('Visual Regression Testing', () => {
  test('login page visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await waitForStable(page, 'form');
    
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('student dashboard visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new StudentDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await dashboardPage.goto();
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('student-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('teacher dashboard visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const teacherPage = new TeacherDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.teacher.email, TEST_USERS.teacher.password);
    await waitForNetworkIdle(page);
    
    await teacherPage.goto();
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('teacher-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('parent dashboard visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const parentPage = new ParentDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.parent.email, TEST_USERS.parent.password);
    await waitForNetworkIdle(page);
    
    await parentPage.goto();
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('parent-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('admin dashboard visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForNetworkIdle(page);
    
    await adminPage.goto();
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('subscription page visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForNetworkIdle(page);
    
    await adminPage.navigateToSubscription();
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('subscription-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('chat widget visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const chatButton = page.locator('[aria-label*="chat"]');
    await chatButton.click();
    
    const chatWidget = page.locator('[data-testid="chat-widget"]');
    await waitForStable(page, '[data-testid="chat-widget"]');
    
    await expect(chatWidget).toHaveScreenshot('chat-widget.png', {
      maxDiffPixels: 100,
    });
  });

  test('notification panel visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const notificationBell = page.locator('[aria-label*="notification"]');
    await notificationBell.click();
    
    const notificationPanel = page.locator('[data-testid="notifications-panel"]');
    await waitForStable(page, '[data-testid="notifications-panel"]');
    
    await expect(notificationPanel).toHaveScreenshot('notification-panel.png', {
      maxDiffPixels: 100,
    });
  });

  test('assignment submission modal visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new StudentDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await dashboardPage.viewAssignments();
    
    const firstAssignment = page.locator('.assignment-item').first();
    await firstAssignment.locator('button', { hasText: /submit/i }).click();
    
    const modal = page.locator('[role="dialog"]');
    await waitForStable(page, '[role="dialog"]');
    
    await expect(modal).toHaveScreenshot('assignment-submission-modal.png', {
      maxDiffPixels: 100,
    });
  });

  test('error page visual snapshot', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('404-error-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dark mode visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const themeToggle = page.locator('[aria-label*="theme"]');
    await themeToggle.click();
    
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('student-dashboard-dark.png', {
      fullPage: true,
      maxDiffPixels: 300,
    });
  });
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile login page visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await waitForStable(page, 'form');
    
    await expect(page).toHaveScreenshot('mobile-login-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('mobile dashboard visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await waitForStable(page, 'main');
    
    await expect(page).toHaveScreenshot('mobile-student-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('mobile navigation menu visual snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const menuButton = page.locator('button[aria-label*="menu"]');
    await menuButton.click();
    
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await waitForStable(page, '[data-testid="mobile-nav"]');
    
    await expect(mobileNav).toHaveScreenshot('mobile-navigation-menu.png', {
      maxDiffPixels: 100,
    });
  });
});
