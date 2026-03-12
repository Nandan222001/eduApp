import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ParentDashboardPage } from '../../page-objects/ParentDashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle } from '../../utils/helpers';

test.describe('Parent Dashboard - Child Progress', () => {
  let loginPage: LoginPage;
  let parentPage: ParentDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    parentPage = new ParentDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.parent.email, TEST_USERS.parent.password);
    await waitForNetworkIdle(page);
  });

  test('should view parent dashboard', async ({ page }) => {
    await parentPage.goto();
    
    await expect(page).toHaveURL(/parent\/dashboard/);
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should select child and view their data', async ({ page }) => {
    await parentPage.goto();
    
    await parentPage.selectChild('John Doe');
    
    await expect(parentPage.progressChart).toBeVisible();
  });

  test('should view child progress over time', async ({ page }) => {
    await parentPage.goto();
    await parentPage.selectChild('John Doe');
    
    await parentPage.viewProgress();
    
    await expect(parentPage.progressChart).toBeVisible();
    
    const chartCanvas = page.locator('canvas');
    await expect(chartCanvas).toBeVisible();
  });

  test('should view child attendance summary', async ({ page }) => {
    await parentPage.goto();
    await parentPage.selectChild('John Doe');
    
    await parentPage.viewAttendance();
    
    await expect(parentPage.attendanceSummary).toBeVisible();
    
    const percentage = await parentPage.getAttendancePercentage();
    expect(percentage).toMatch(/\d+%/);
  });

  test('should view child grades', async ({ page }) => {
    await parentPage.goto();
    await parentPage.selectChild('John Doe');
    
    await parentPage.viewGrades();
    
    await expect(parentPage.gradesList).toBeVisible();
    
    const gradesCount = await parentPage.gradesList.locator('.grade-item').count();
    expect(gradesCount).toBeGreaterThan(0);
  });

  test('should view notifications about child', async ({ page }) => {
    await parentPage.goto();
    
    await expect(parentPage.notificationsList).toBeVisible();
    
    const notifications = parentPage.notificationsList.locator('.notification-item');
    const count = await notifications.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should switch between multiple children', async ({ page }) => {
    await parentPage.goto();
    
    await parentPage.selectChild('John Doe');
    await expect(page.locator('text=John Doe')).toBeVisible();
    
    await parentPage.selectChild('Jane Doe');
    await expect(page.locator('text=Jane Doe')).toBeVisible();
  });

  test('should view detailed subject-wise performance', async ({ page }) => {
    await parentPage.goto();
    await parentPage.selectChild('John Doe');
    await parentPage.viewProgress();
    
    const subjectButton = page.locator('button', { hasText: /mathematics/i });
    await subjectButton.click();
    
    const detailedView = page.locator('[data-testid="subject-details"]');
    await expect(detailedView).toBeVisible();
  });

  test('should view upcoming assignments for child', async ({ page }) => {
    await parentPage.goto();
    await parentPage.selectChild('John Doe');
    
    const assignmentsTab = page.locator('[role="tab"]', { hasText: /assignments/i });
    await assignmentsTab.click();
    
    const assignmentsList = page.locator('[data-testid="assignments-list"]');
    await expect(assignmentsList).toBeVisible();
  });
});
