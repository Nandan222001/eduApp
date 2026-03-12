import { Page, Locator } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly subscriptionLink: Locator;
  readonly currentPlanCard: Locator;
  readonly upgradeButton: Locator;
  readonly planCards: Locator;
  readonly confirmUpgradeButton: Locator;
  readonly analyticsLink: Locator;
  readonly usersLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.subscriptionLink = page.locator('a[href*="subscription"]');
    this.currentPlanCard = page.locator('[data-testid="current-plan"]');
    this.upgradeButton = page.locator('button', { hasText: /upgrade/i });
    this.planCards = page.locator('[data-testid="plan-card"]');
    this.confirmUpgradeButton = page.locator('button', { hasText: /confirm/i });
    this.analyticsLink = page.locator('a[href*="analytics"]');
    this.usersLink = page.locator('a[href*="users"]');
  }

  async goto() {
    await this.page.goto('/admin/dashboard');
  }

  async navigateToSubscription() {
    await this.subscriptionLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async upgradePlan(planName: string) {
    await this.navigateToSubscription();
    
    const planCard = this.planCards.filter({ hasText: planName });
    await planCard.locator('button', { hasText: /select|upgrade/i }).click();
    
    await this.confirmUpgradeButton.click();
  }

  async getCurrentPlan(): Promise<string> {
    await this.navigateToSubscription();
    const planNameElement = this.currentPlanCard.locator('[data-testid="plan-name"]');
    return (await planNameElement.textContent()) || '';
  }
}
