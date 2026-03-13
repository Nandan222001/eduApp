import { Page, expect } from '@playwright/test';

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for and check toast notification
 */
export async function waitForToast(page: Page, message: string) {
  const toast = page.locator('[role="alert"]', { hasText: message });
  await expect(toast).toBeVisible({ timeout: 5000 });
  return toast;
}

/**
 * Fill form with data
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`[name="${name}"]`, value);
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, url: string | RegExp, timeout = 10000) {
  return page.waitForResponse((response) => {
    const responseUrl = response.url();
    if (typeof url === 'string') {
      return responseUrl.includes(url);
    }
    return url.test(responseUrl);
  }, { timeout });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const box = await element.boundingBox();
  if (!box) return false;

  const viewport = page.viewportSize();
  if (!viewport) return false;

  return (
    box.y >= 0 &&
    box.x >= 0 &&
    box.y + box.height <= viewport.height &&
    box.x + box.width <= viewport.width
  );
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Wait for element to be stable (no animations)
 */
export async function waitForStable(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  
  // Wait for animations to complete
  await page.waitForTimeout(300);
  
  // Check if element position is stable
  const box1 = await element.boundingBox();
  await page.waitForTimeout(100);
  const box2 = await element.boundingBox();
  
  if (box1 && box2) {
    const isStable = box1.x === box2.x && box1.y === box2.y;
    if (!isStable) {
      await waitForStable(page, selector);
    }
  }
}

/**
 * Check accessibility violations (basic check)
 */
export async function checkA11y(page: Page) {
  // Check for basic accessibility issues
  const missingAltImages = await page.locator('img:not([alt])').count();
  expect(missingAltImages).toBe(0);

  const missingLabels = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();
  expect(missingLabels).toBe(0);
}

/**
 * Simulate slow network
 */
export async function setSlowNetwork(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 500 * 1024 / 8,
    uploadThroughput: 500 * 1024 / 8,
    latency: 400,
  });
}

/**
 * Reset network conditions
 */
export async function resetNetwork(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
}

/**
 * Generate random email
 */
export function generateRandomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Get current timestamp for unique data
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
