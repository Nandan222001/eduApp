import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Performance - Page Load Times', () => {
  test('login page should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('student dashboard should load within 5 seconds', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    
    const startTime = Date.now();
    
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    
    await page.goto('/student/dashboard');
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        setTimeout(() => resolve({}), 10000);
      });
    });
    
    console.log('Web Vitals:', metrics);
    
    if ((metrics as any).LCP) {
      expect((metrics as any).LCP).toBeLessThan(2500);
    }
  });

  test('API response time should be acceptable', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/') && response.status() === 200
    );
    
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    
    const response = await responsePromise;
    const timing = await response.timing();
    
    const totalTime = timing.responseEnd;
    expect(totalTime).toBeLessThan(2000);
  });
});
