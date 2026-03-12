import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { AdminDashboardPage } from '../../page-objects/AdminDashboardPage';
import { TEST_USERS, TEST_SUBSCRIPTION_PLANS } from '../../fixtures/test-data';
import { waitForNetworkIdle, waitForToast } from '../../utils/helpers';

test.describe('Admin Subscription Upgrade Flow', () => {
  let loginPage: LoginPage;
  let adminPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminPage = new AdminDashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForNetworkIdle(page);
  });

  test('should view current subscription plan', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    await expect(adminPage.currentPlanCard).toBeVisible();
    
    const planName = await adminPage.getCurrentPlan();
    expect(planName).toBeTruthy();
  });

  test('should display available subscription plans', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    const plansCount = await adminPage.planCards.count();
    expect(plansCount).toBeGreaterThan(0);
  });

  test('should upgrade to premium plan', async ({ page }) => {
    await adminPage.upgradePlan(TEST_SUBSCRIPTION_PLANS.premium.name);
    
    await waitForToast(page, /subscription updated/i);
    
    const currentPlan = await adminPage.getCurrentPlan();
    expect(currentPlan).toContain(TEST_SUBSCRIPTION_PLANS.premium.name);
  });

  test('should show plan features comparison', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    const compareButton = page.locator('button', { hasText: /compare plans/i });
    await compareButton.click();
    
    const comparisonTable = page.locator('[data-testid="plans-comparison"]');
    await expect(comparisonTable).toBeVisible();
  });

  test('should handle payment modal', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    const planCard = adminPage.planCards.filter({
      hasText: TEST_SUBSCRIPTION_PLANS.premium.name,
    });
    await planCard.locator('button', { hasText: /upgrade/i }).click();
    
    const paymentModal = page.locator('[data-testid="payment-modal"]');
    await expect(paymentModal).toBeVisible();
    
    const cancelButton = paymentModal.locator('button', { hasText: /cancel/i });
    await cancelButton.click();
    
    await expect(paymentModal).not.toBeVisible();
  });

  test('should view billing history', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    const billingTab = page.locator('[role="tab"]', { hasText: /billing history/i });
    await billingTab.click();
    
    const historyTable = page.locator('[data-testid="billing-history"]');
    await expect(historyTable).toBeVisible();
  });

  test('should download invoice', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    const billingTab = page.locator('[role="tab"]', { hasText: /billing history/i });
    await billingTab.click();
    
    const downloadButton = page.locator('button', { hasText: /download/i }).first();
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/invoice/i);
  });

  test('should cancel subscription', async ({ page }) => {
    await adminPage.navigateToSubscription();
    
    const cancelButton = page.locator('button', { hasText: /cancel subscription/i });
    await cancelButton.click();
    
    const confirmDialog = page.locator('[role="dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    const cancelConfirmButton = confirmDialog.locator('button', { hasText: /confirm/i });
    await cancelConfirmButton.click();
    
    await waitForToast(page, /subscription cancelled/i);
  });
});
