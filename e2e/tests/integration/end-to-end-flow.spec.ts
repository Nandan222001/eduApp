import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { StudentDashboardPage } from '../../page-objects/StudentDashboardPage';
import { AIPredictionPage } from '../../page-objects/AIPredictionPage';
import { ChatPage } from '../../page-objects/ChatPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle, waitForToast } from '../../utils/helpers';
import path from 'path';

test.describe('Complete Student Journey', () => {
  test('complete student workflow from login to assignment submission', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new StudentDashboardPage(page);
    
    await test.step('Login as student', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
      await waitForNetworkIdle(page);
      await expect(page).toHaveURL(/student\/dashboard/);
    });

    await test.step('View dashboard and assignments', async () => {
      await dashboardPage.viewAssignments();
      await expect(dashboardPage.assignmentsList).toBeVisible();
    });

    await test.step('Submit an assignment', async () => {
      const testFile = path.join(__dirname, '../../fixtures/sample-assignment.pdf');
      await dashboardPage.submitAssignment(0, testFile);
      await waitForToast(page, /submitted successfully/i);
    });

    await test.step('Check AI predictions', async () => {
      const predictionPage = new AIPredictionPage(page);
      await dashboardPage.openAIPrediction();
      await predictionPage.waitForChartLoad();
      await expect(predictionPage.predictionChart).toBeVisible();
    });

    await test.step('Use chat feature', async () => {
      const chatPage = new ChatPage(page);
      await chatPage.openChat();
      await chatPage.sendMessage('Test message from student');
      await chatPage.waitForMessage('Test message from student');
    });

    await test.step('Search for content', async () => {
      await dashboardPage.searchContent('mathematics');
      await expect(page).toHaveURL(/search/);
    });
  });
});

test.describe('Complete Teacher Journey', () => {
  test('complete teacher workflow from login to grading', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await test.step('Login as teacher', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.teacher.email, TEST_USERS.teacher.password);
      await waitForNetworkIdle(page);
      await expect(page).toHaveURL(/teacher\/dashboard/);
    });

    await test.step('Mark attendance', async () => {
      const attendanceLink = page.locator('a[href*="attendance"]');
      await attendanceLink.click();
      await waitForNetworkIdle(page);
      
      const markButton = page.locator('button', { hasText: /mark attendance/i });
      await markButton.click();
    });

    await test.step('Grade assignments', async () => {
      const assignmentsLink = page.locator('a[href*="assignments"]');
      await assignmentsLink.click();
      await waitForNetworkIdle(page);
      
      const firstAssignment = page.locator('.assignment-item').first();
      const gradeButton = firstAssignment.locator('button', { hasText: /grade/i });
      
      if (await gradeButton.isVisible()) {
        await gradeButton.click();
        
        const gradeInput = page.locator('input[name*="grade"]');
        await gradeInput.fill('85');
        
        const submitButton = page.locator('button', { hasText: /submit/i });
        await submitButton.click();
      }
    });

    await test.step('View analytics', async () => {
      const analyticsLink = page.locator('a[href*="analytics"]');
      await analyticsLink.click();
      await waitForNetworkIdle(page);
      
      const charts = page.locator('canvas');
      const count = await charts.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe('Complete Admin Journey', () => {
  test('complete admin workflow from login to subscription upgrade', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await test.step('Login as admin', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
      await waitForNetworkIdle(page);
      await expect(page).toHaveURL(/admin\/dashboard/);
    });

    await test.step('View dashboard analytics', async () => {
      const statsCards = page.locator('[data-testid="stat-card"]');
      const count = await statsCards.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Manage users', async () => {
      const usersLink = page.locator('a[href*="users"]');
      await usersLink.click();
      await waitForNetworkIdle(page);
      
      const usersList = page.locator('[data-testid="users-list"]');
      await expect(usersList).toBeVisible();
    });

    await test.step('View subscription options', async () => {
      const subscriptionLink = page.locator('a[href*="subscription"]');
      await subscriptionLink.click();
      await waitForNetworkIdle(page);
      
      const planCards = page.locator('[data-testid="plan-card"]');
      const count = await planCards.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Export data', async () => {
      const dataLink = page.locator('a[href*="data"]');
      await dataLink.click();
      await waitForNetworkIdle(page);
    });
  });
});

test.describe('Cross-role Interactions', () => {
  test('teacher grades assignment and student receives notification', async ({ page, context }) => {
    const teacherPage = await context.newPage();
    const studentPage = page;
    
    await test.step('Student submits assignment', async () => {
      const loginPage = new LoginPage(studentPage);
      await loginPage.goto();
      await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
      await waitForNetworkIdle(studentPage);
      
      const dashboardPage = new StudentDashboardPage(studentPage);
      await dashboardPage.viewAssignments();
      
      const testFile = path.join(__dirname, '../../fixtures/sample-assignment.pdf');
      await dashboardPage.submitAssignment(0, testFile);
    });

    await test.step('Teacher grades assignment', async () => {
      const loginPage = new LoginPage(teacherPage);
      await loginPage.goto();
      await loginPage.login(TEST_USERS.teacher.email, TEST_USERS.teacher.password);
      await waitForNetworkIdle(teacherPage);
      
      const assignmentsLink = teacherPage.locator('a[href*="assignments"]');
      await assignmentsLink.click();
      await waitForNetworkIdle(teacherPage);
      
      const firstSubmission = teacherPage.locator('.assignment-item').first();
      const gradeButton = firstSubmission.locator('button', { hasText: /grade/i });
      
      if (await gradeButton.isVisible()) {
        await gradeButton.click();
        
        const gradeInput = teacherPage.locator('input[name*="grade"]');
        await gradeInput.fill('90');
        
        const submitButton = teacherPage.locator('button', { hasText: /submit/i });
        await submitButton.click();
      }
    });

    await test.step('Student receives notification', async () => {
      await studentPage.reload();
      await waitForNetworkIdle(studentPage);
      
      const notificationBell = studentPage.locator('[aria-label*="notification"]');
      const badge = notificationBell.locator('[data-testid="notification-count"]');
      
      const count = await badge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThan(0);
    });
  });
});
