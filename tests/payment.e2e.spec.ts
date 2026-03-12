import { test, expect } from '@playwright/test';

test.describe('Payment and Subscription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@testschool.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test('should display subscription plans', async ({ page }) => {
    await page.click('text=/subscription|billing/i');
    await expect(page.locator('.plan-card, [data-testid="plan"]')).toBeVisible();
  });

  test('should view invoice history', async ({ page }) => {
    await page.click('text=/subscription|billing/i');
    await page.click('text=/invoice|billing history/i');
    await expect(page.locator('table, .invoice-list')).toBeVisible();
  });
});
