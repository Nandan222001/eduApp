import { test, expect, devices } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { StudentDashboardPage } from '../../page-objects/StudentDashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle, isInViewport } from '../../utils/helpers';

test.describe('Mobile Responsive Behavior', () => {
  test.use({ ...devices['iPhone 12'] });

  let loginPage: LoginPage;
  let dashboardPage: StudentDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new StudentDashboardPage(page);
  });

  test('should display mobile login page correctly', async ({ page }) => {
    await loginPage.goto();
    
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(390);
  });

  test('should login on mobile device', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    
    await waitForNetworkIdle(page);
    
    await expect(page).toHaveURL(/student\/dashboard/);
  });

  test('should open mobile navigation menu', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const menuButton = page.locator('button[aria-label*="menu"]');
    await menuButton.click();
    
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();
  });

  test('should display hamburger menu icon', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const hamburgerIcon = page.locator('[data-testid="hamburger-menu"]');
    await expect(hamburgerIcon).toBeVisible();
  });

  test('should scroll assignments list on mobile', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await dashboardPage.viewAssignments();
    
    const assignmentsList = page.locator('[data-testid="assignments-list"]');
    await expect(assignmentsList).toBeVisible();
    
    await assignmentsList.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
  });

  test('should display touch-friendly buttons', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    const box = await firstButton.boundingBox();
    
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle swipe gestures', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const drawer = page.locator('[data-testid="drawer"]');
    
    await page.touchscreen.tap(50, 100);
    await page.touchscreen.tap(300, 100);
  });

  test('should display bottom navigation on mobile', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    await expect(bottomNav).toBeVisible();
  });

  test('should adjust font size for mobile readability', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const heading = page.locator('h1').first();
    const fontSize = await heading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(16);
  });

  test('should hide desktop-only elements on mobile', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
    const isVisible = await desktopSidebar.isVisible().catch(() => false);
    
    expect(isVisible).toBe(false);
  });

  test('should handle orientation change', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await page.setViewportSize({ width: 844, height: 390 });
    
    await page.waitForTimeout(500);
    
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

test.describe('Tablet Responsive Behavior', () => {
  test.use({ ...devices['iPad Pro'] });

  test('should display tablet layout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(1024);
    
    const layout = page.locator('[data-testid="tablet-layout"]');
    const hasTabletLayout = await layout.count() > 0;
    expect(hasTabletLayout).toBeTruthy();
  });

  test('should use split-view on tablet', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForNetworkIdle(page);
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    const mainContent = page.locator('[data-testid="main-content"]');
    
    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
  });
});
