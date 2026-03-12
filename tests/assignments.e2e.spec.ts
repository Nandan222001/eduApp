import { test, expect } from '@playwright/test';

test.describe('Assignment Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'teacher@testschool.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.click('text=/assignment/i');
  });

  test('should create new assignment', async ({ page }) => {
    await page.click('button:has-text("Create Assignment"), button:has-text("New Assignment")');
    
    await page.fill('input[name="title"]', 'Math Homework 1');
    await page.fill('textarea[name="description"]', 'Complete exercises 1-10');
    await page.fill('input[name="total_marks"]', '100');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/success|created/i')).toBeVisible();
  });
});
