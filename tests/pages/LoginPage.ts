import { expect, type Locator, type Page } from '@playwright/test';
import type { Credentials } from '../types/task';

/**
 * Page Object for the sign-in screen. Specs say *what* to do (loginPage.loginAs(user));
 * only this file knows *how*. Locators are lazy: nothing touches the page until a
 * test acts or asserts, and Playwright auto-waits at that point.
 */
export class LoginPage {
  readonly region: Locator;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;

  constructor(private readonly page: Page) {
    // <section aria-labelledby> is a named "region". Scoping everything to it means a
    // future toast or second alert elsewhere on the page can't make these ambiguous.
    this.region = page.getByRole('region', { name: 'Sign in', exact: true });
    this.heading = this.region.getByRole('heading', { name: 'Sign in', exact: true });
    this.emailInput = this.region.getByLabel('Email', { exact: true });
    this.passwordInput = this.region.getByLabel('Password', { exact: true });
    this.submitButton = this.region.getByRole('button', { name: 'Sign in', exact: true });
    this.formError = this.region.getByRole('alert');
    // Field errors are linked with aria-describedby, so tests assert them with
    // toHaveAccessibleDescription() on the input: the same thing a screen reader announces.
  }

  async goto() {
    await this.page.goto('/');
    // A meaningful page-level check: the app has decided to show the login screen.
    await expect(this.heading).toBeVisible();
  }

  async loginAs({ email, password }: Credentials) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
