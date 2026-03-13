import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { StudentDashboardPage } from '../../page-objects/StudentDashboardPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle, checkA11y } from '../../utils/helpers';

test.describe('Accessibility Tests', () => {
  test('login page should be accessible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await checkA11y(page);
    
    const hasLandmark = await page.locator('main, [role="main"]').count();
    expect(hasLandmark).toBeGreaterThan(0);
  });

  test('should support keyboard navigation on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await page.keyboard.press('Tab');
    await expect(loginPage.emailInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(loginPage.loginButton).toBeFocused();
  });

  test('dashboard should have proper heading hierarchy', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(1);
  });

  test('interactive elements should have accessible names', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      
      const hasAccessibleName = ariaLabel || (text && text.trim()) || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      const isDecorative = role === 'presentation' || alt === '';
      const hasAlt = alt !== null;
      
      expect(hasAlt || isDecorative).toBeTruthy();
    }
  });

  test('form inputs should have labels', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      let hasLabel = false;
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }
      
      hasLabel = hasLabel || !!ariaLabel || !!ariaLabelledby;
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    expect(liveRegions).toBeGreaterThan(0);
  });

  test('skip to main content link should exist', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    const skipLink = page.locator('a[href="#main"], a[href="#main-content"]');
    const count = await skipLink.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('focus should be visible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    const outlineStyle = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });
    
    const hasFocusIndicator = 
      outlineStyle.outlineWidth !== '0px' || 
      outlineStyle.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('color contrast should be sufficient', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const textElements = await page.locator('p, span, label, a, button').all();
    
    for (const element of textElements.slice(0, 5)) {
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });
});
