import { test, expect } from '@playwright/test';

test.describe('Attendance Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'teacher@testschool.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.click('text=/attendance/i');
  });

  test('should display attendance interface', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/attendance/i);
  });

  test('should mark student as present', async ({ page }) => {
    await page.click('button:has-text("Mark Attendance")');
    await page.waitForSelector('[data-testid="student-row"], .student-card');
    
    const presentButton = page.locator('button:has-text("Present")').first();
    await presentButton.click();
    
    await expect(page.locator('text=/marked|success/i')).toBeVisible();
  });
});
