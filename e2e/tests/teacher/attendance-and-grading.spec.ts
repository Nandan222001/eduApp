import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { TeacherDashboardPage } from '../../page-objects/TeacherDashboardPage';
import { TEST_USERS, TEST_ATTENDANCE } from '../../fixtures/test-data';
import { waitForNetworkIdle, waitForToast } from '../../utils/helpers';

test.describe('Teacher Attendance Marking and Grading', () => {
  let loginPage: LoginPage;
  let teacherPage: TeacherDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teacherPage = new TeacherDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.teacher.email, TEST_USERS.teacher.password);
    await waitForNetworkIdle(page);
  });

  test('should navigate to attendance marking page', async ({ page }) => {
    await teacherPage.navigateToAttendance();
    
    await expect(page).toHaveURL(/attendance/);
    await expect(teacherPage.markAttendanceButton).toBeVisible();
  });

  test('should mark attendance for a class', async ({ page }) => {
    const presentStudents = ['student-1', 'student-3'];
    
    await teacherPage.markAttendance(TEST_ATTENDANCE.classId, presentStudents);
    
    await waitForToast(page, /attendance saved/i);
    
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
  });

  test('should select all students as present', async ({ page }) => {
    await teacherPage.navigateToAttendance();
    await teacherPage.markAttendanceButton.click();
    
    await teacherPage.classSelect.selectOption(TEST_ATTENDANCE.classId);
    
    const selectAllButton = page.locator('button', { hasText: /select all/i });
    await selectAllButton.click();
    
    const checkedBoxes = await page.locator('input[type="checkbox"]:checked').count();
    expect(checkedBoxes).toBeGreaterThan(0);
  });

  test('should grade student assignment', async ({ page }) => {
    await teacherPage.gradeAssignment(0, 85, 'Good work! Keep it up.');
    
    await waitForToast(page, /grade submitted/i);
  });

  test('should view attendance report', async ({ page }) => {
    await teacherPage.navigateToAttendance();
    
    const reportButton = page.locator('button', { hasText: /view report/i });
    await reportButton.click();
    
    const reportTable = page.locator('[data-testid="attendance-report"]');
    await expect(reportTable).toBeVisible();
  });

  test('should filter students by attendance status', async ({ page }) => {
    await teacherPage.navigateToAttendance();
    
    const filterSelect = page.locator('select[name="status"]');
    await filterSelect.selectOption('absent');
    
    await page.waitForLoadState('networkidle');
    
    const studentsList = page.locator('[data-testid="students-list"]');
    await expect(studentsList).toBeVisible();
  });

  test('should bulk grade assignments', async ({ page }) => {
    const bulkGradeButton = page.locator('button', { hasText: /bulk grade/i });
    await bulkGradeButton.click();
    
    const gradeInputs = page.locator('input[name*="grade"]');
    const count = await gradeInputs.count();
    
    for (let i = 0; i < count; i++) {
      await gradeInputs.nth(i).fill('80');
    }
    
    const submitButton = page.locator('button', { hasText: /submit all/i });
    await submitButton.click();
    
    await waitForToast(page, /grades submitted/i);
  });

  test('should download attendance sheet', async ({ page }) => {
    await teacherPage.navigateToAttendance();
    
    const downloadButton = page.locator('button', { hasText: /download|export/i });
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/attendance/i);
  });
});
