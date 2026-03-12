import { expect } from '@playwright/test';

export function setupCustomMatchers() {
  expect.extend({
    async toBeWithinRange(received: number, floor: number, ceiling: number) {
      const pass = received >= floor && received <= ceiling;
      
      if (pass) {
        return {
          message: () =>
            `expected ${received} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },

    async toHaveLoadedWithin(page: any, maxTime: number) {
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        return timing.loadEventEnd - timing.navigationStart;
      });

      const pass = metrics <= maxTime;

      if (pass) {
        return {
          message: () => `expected page load time ${metrics}ms to exceed ${maxTime}ms`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected page load time ${metrics}ms to be within ${maxTime}ms`,
          pass: false,
        };
      }
    },
  });
}
