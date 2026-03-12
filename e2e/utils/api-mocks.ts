import { Page, Route } from '@playwright/test';
import { mockApiResponses } from '../fixtures/mock-api-responses';

/**
 * Setup API mocks for testing
 */
export async function setupApiMocks(page: Page) {
  await page.route('**/api/auth/login', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    if (postData.email.includes('invalid')) {
      await route.fulfill({
        status: 401,
        body: JSON.stringify(mockApiResponses.login.error),
      });
    } else {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(mockApiResponses.login.success),
      });
    }
  });

  await page.route('**/api/assignments**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockApiResponses.assignments.list),
    });
  });

  await page.route('**/api/attendance/summary**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockApiResponses.attendance.summary),
    });
  });

  await page.route('**/api/predictions**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockApiResponses.predictions),
    });
  });

  await page.route('**/api/subscriptions/current**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockApiResponses.subscriptions.current),
    });
  });

  await page.route('**/api/subscriptions/plans**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockApiResponses.subscriptions.plans),
    });
  });

  await page.route('**/api/notifications**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockApiResponses.notifications.list),
    });
  });
}

/**
 * Mock file upload endpoint
 */
export async function mockFileUpload(page: Page) {
  await page.route('**/api/assignments/*/submit', async (route: Route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'Assignment submitted successfully',
        submissionId: 'sub-123',
      }),
    });
  });
}

/**
 * Mock WebSocket connection
 */
export async function mockWebSocket(page: Page) {
  await page.addInitScript(() => {
    class MockWebSocket {
      url: string;
      readyState: number;
      onopen: ((event: Event) => void) | null;
      onmessage: ((event: MessageEvent) => void) | null;
      onerror: ((event: Event) => void) | null;
      onclose: ((event: CloseEvent) => void) | null;

      constructor(url: string) {
        this.url = url;
        this.readyState = 1;
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;

        setTimeout(() => {
          if (this.onopen) {
            this.onopen(new Event('open'));
          }
        }, 100);
      }

      send(data: string) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { data }));
          }
        }, 100);
      }

      close() {
        this.readyState = 3;
        if (this.onclose) {
          this.onclose(new CloseEvent('close'));
        }
      }
    }

    (window as any).WebSocket = MockWebSocket;
  });
}

/**
 * Mock slow network for testing
 */
export async function mockSlowNetwork(page: Page) {
  await page.route('**/*', async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await route.continue();
  });
}

/**
 * Mock failed API call
 */
export async function mockApiFailure(page: Page, endpoint: string, statusCode = 500) {
  await page.route(`**${endpoint}**`, async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An error occurred',
      }),
    });
  });
}
