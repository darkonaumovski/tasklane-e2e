import { env } from '../../config/env';
import { test, expect } from '../../fixtures';

// Browser projects start logged in (storageState). These tests need a logged-out browser.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('a valid user lands on their task list', { tag: '@smoke' }, async ({ loginPage, tasksPage }) => {
    await loginPage.loginAs(env.user);

    await expect(tasksPage.heading).toBeVisible();
    await expect(loginPage.region).toBeHidden();
  });

  test('a wrong password is rejected with a form error', async ({ loginPage }) => {
    await loginPage.loginAs({ email: env.user.email, password: 'not-the-password' });

    await expect(loginPage.formError).toHaveText('Invalid email or password');
    await expect(loginPage.heading).toBeVisible();
  });

  test('an unknown user is rejected with the same error', async ({ loginPage }) => {
    // Same message as a wrong password, so the form doesn't reveal which accounts exist.
    await loginPage.loginAs({ email: 'nobody@tasklane.test', password: env.user.password });

    await expect(loginPage.formError).toHaveText('Invalid email or password');
  });

  test('logging out returns to the login screen', async ({ loginPage, tasksPage }) => {
    await loginPage.loginAs(env.user);
    await tasksPage.logoutButton.click();

    await expect(loginPage.heading).toBeVisible();
  });

  test.describe('client-side validation', () => {
    // Data-driven: one row per scenario, one generated test per row.
    const cases = [
      {
        scenario: 'an empty form',
        input: { email: '', password: '' },
        emailError: 'Email is required',
        passwordError: 'Password is required',
      },
      {
        scenario: 'a malformed email',
        input: { email: 'demo@', password: 'whatever123' },
        emailError: 'Enter a valid email address',
        passwordError: '',
      },
      {
        scenario: 'a short password',
        input: { email: 'demo@tasklane.test', password: 'short' },
        emailError: '',
        passwordError: 'Password must be at least 8 characters',
      },
    ];

    for (const { scenario, input, emailError, passwordError } of cases) {
      test(`${scenario} shows inline errors and never calls the server`, async ({ loginPage, page }) => {
        const loginRequests: string[] = [];
        page.on('request', (request) => {
          if (new URL(request.url()).pathname === '/api/login') loginRequests.push(request.url());
        });

        await loginPage.loginAs(input);

        // The error text is linked to the field with aria-describedby, so the accessible
        // description is what a screen reader announces. '' means "no error".
        await expect(loginPage.emailInput).toHaveAccessibleDescription(emailError);
        await expect(loginPage.passwordInput).toHaveAccessibleDescription(passwordError);
        await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', String(emailError !== ''));
        await expect(loginPage.passwordInput).toHaveAttribute('aria-invalid', String(passwordError !== ''));
        expect(loginRequests).toEqual([]);
      });
    }
  });
});
