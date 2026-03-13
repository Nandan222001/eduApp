import { Page, Locator } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly chatWidget: Locator;
  readonly chatToggle: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messagesList: Locator;
  readonly typingIndicator: Locator;
  readonly onlineStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatWidget = page.locator('[data-testid="chat-widget"]');
    this.chatToggle = page.locator('button[aria-label*="chat"]');
    this.messageInput = page.locator('input[placeholder*="message"]');
    this.sendButton = page.locator('button[aria-label*="send"]');
    this.messagesList = page.locator('[data-testid="messages-list"]');
    this.typingIndicator = page.locator('[data-testid="typing-indicator"]');
    this.onlineStatus = page.locator('[data-testid="online-status"]');
  }

  async openChat() {
    if (!(await this.chatWidget.isVisible())) {
      await this.chatToggle.click();
    }
    await this.chatWidget.waitFor({ state: 'visible' });
  }

  async sendMessage(message: string) {
    await this.openChat();
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async waitForMessage(messageText: string, timeout = 10000) {
    const message = this.messagesList.locator('[data-testid="message"]', { hasText: messageText });
    await message.waitFor({ state: 'visible', timeout });
  }

  async isTypingIndicatorVisible(): Promise<boolean> {
    return await this.typingIndicator.isVisible();
  }

  async closeChat() {
    const closeButton = this.chatWidget.locator('button[aria-label*="close"]');
    await closeButton.click();
  }
}
