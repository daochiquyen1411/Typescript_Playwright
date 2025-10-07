import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly loginButton: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    // Optimized locators with fallback strategies
    this.loginButton = page.locator('a[href*="login"], button:has-text("Login"), [data-test*="login"]').first();
    this.emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]').first();
    this.passwordInput = page.locator('input[type="password"], input[name*="password"]').first();
    this.submitButton = page.getByTestId('login-submit');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('https://practicesoftwaretesting.com/auth/login');
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }
}
