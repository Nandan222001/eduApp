import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly otpTab: Locator;
  readonly otpInput: Locator;
  readonly sendOtpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]', { hasText: /login/i });
    this.forgotPasswordLink = page.locator('a', { hasText: /forgot password/i });
    this.registerLink = page.locator('a', { hasText: /register|sign up/i });
    this.errorMessage = page.locator('[role="alert"]');
    this.otpTab = page.locator('button', { hasText: /otp/i });
    this.otpInput = page.locator('input[name="otp"]');
    this.sendOtpButton = page.locator('button', { hasText: /send otp/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithOTP(email: string, otp: string) {
    await this.otpTab.click();
    await this.emailInput.fill(email);
    await this.sendOtpButton.click();
    await this.otpInput.fill(otp);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}
