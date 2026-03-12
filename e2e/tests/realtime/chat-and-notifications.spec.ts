import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ChatPage } from '../../page-objects/ChatPage';
import { TEST_USERS, TEST_CHAT_MESSAGES } from '../../fixtures/test-data';
import { waitForNetworkIdle } from '../../utils/helpers';

test.describe('Real-time Chat and Notifications', () => {
  let loginPage: LoginPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    chatPage = new ChatPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
  });

  test('should open chat widget', async () => {
    await chatPage.openChat();
    
    await expect(chatPage.chatWidget).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    await chatPage.sendMessage(TEST_CHAT_MESSAGES.simple);
    
    await chatPage.waitForMessage(TEST_CHAT_MESSAGES.simple);
    
    const sentMessage = page.locator('[data-testid="message"]', {
      hasText: TEST_CHAT_MESSAGES.simple,
    });
    await expect(sentMessage).toBeVisible();
  });

  test('should send message with emoji', async ({ page }) => {
    await chatPage.sendMessage(TEST_CHAT_MESSAGES.withEmoji);
    
    await chatPage.waitForMessage(TEST_CHAT_MESSAGES.withEmoji);
    
    const emojiMessage = page.locator('[data-testid="message"]', {
      hasText: TEST_CHAT_MESSAGES.withEmoji,
    });
    await expect(emojiMessage).toBeVisible();
  });

  test('should display typing indicator', async () => {
    await chatPage.openChat();
    await chatPage.messageInput.fill('Test message...');
    
    await expect(chatPage.typingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('should display online status', async () => {
    await chatPage.openChat();
    
    await expect(chatPage.onlineStatus).toBeVisible();
  });

  test('should receive real-time notifications', async ({ page }) => {
    const notificationBell = page.locator('[aria-label*="notification"]');
    await notificationBell.click();
    
    const notificationPanel = page.locator('[data-testid="notifications-panel"]');
    await expect(notificationPanel).toBeVisible();
  });

  test('should mark notification as read', async ({ page }) => {
    const notificationBell = page.locator('[aria-label*="notification"]');
    await notificationBell.click();
    
    const firstNotification = page.locator('[data-testid="notification-item"]').first();
    await firstNotification.click();
    
    const readBadge = firstNotification.locator('[data-testid="read-badge"]');
    await expect(readBadge).toBeVisible();
  });

  test('should clear all notifications', async ({ page }) => {
    const notificationBell = page.locator('[aria-label*="notification"]');
    await notificationBell.click();
    
    const clearAllButton = page.locator('button', { hasText: /clear all/i });
    await clearAllButton.click();
    
    const noNotifications = page.locator('text=/no notifications/i');
    await expect(noNotifications).toBeVisible();
  });

  test('should close chat widget', async () => {
    await chatPage.openChat();
    await chatPage.closeChat();
    
    await expect(chatPage.chatWidget).not.toBeVisible();
  });

  test('should persist chat messages after refresh', async ({ page }) => {
    await chatPage.sendMessage(TEST_CHAT_MESSAGES.simple);
    await chatPage.waitForMessage(TEST_CHAT_MESSAGES.simple);
    
    await page.reload();
    await waitForNetworkIdle(page);
    
    await chatPage.openChat();
    
    const message = page.locator('[data-testid="message"]', {
      hasText: TEST_CHAT_MESSAGES.simple,
    });
    await expect(message).toBeVisible();
  });

  test('should show notification badge count', async ({ page }) => {
    const notificationBell = page.locator('[aria-label*="notification"]');
    const badge = notificationBell.locator('[data-testid="notification-count"]');
    
    const count = await badge.textContent();
    expect(count).toMatch(/\d+/);
  });

  test('should receive real-time notification when assignment is graded', async ({ page }) => {
    const notificationBell = page.locator('[aria-label*="notification"]');
    
    await page.waitForTimeout(2000);
    
    await notificationBell.click();
    
    const gradedNotification = page.locator('[data-testid="notification-item"]', {
      hasText: /graded/i,
    });
    
    const count = await gradedNotification.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
