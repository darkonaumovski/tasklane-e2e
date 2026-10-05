import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the sign-in screen.
 *
 * A Page Object keeps every locator for one screen in one place. Specs say
 * *what* to do (loginPage.login(...)), and only this file knows *how*. If the
 * markup changes, you fix it here instead of in every test.
 */
export class LoginPage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(private readonly page: Page) {
    // Locators are lazy: creating one doesn't touch the page. Playwright looks the
    // element up (and waits for it) only when you act on it or assert on it.
    this.heading = page.getByRole('heading', { name: 'Sign in' });

    // getByLabel finds an input the way a user does: by the text of its <label>.
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');

    // getByRole uses the accessibility tree, so it also checks that the button is
    // exposed correctly to screen readers.
    this.submitButton = page.getByRole('button', { name: 'Sign in' });

    // The "wrong password" message is a role="alert" region.
    this.formError = page.getByRole('alert');

    // The per-field messages are plain <p> elements with no role or label of their own.
    // That's when we fall back to data-testid.
    this.emailError = page.getByTestId('email-error');
    this.passwordError = page.getByTestId('password-error');
  }

  async goto() {
    await this.page.goto('/');
    // Waiting for something visible ensures the app has decided which screen to show.
    await expect(this.heading).toBeVisible();
  }

  async login(email: string, password: string) {
    // fill() clears the field first, then types the whole value at once.
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
