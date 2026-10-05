import { test, expect } from '../fixtures';
import { testUser } from '../support/test-data';

// The browser projects start every test logged in (storageState in the config).
// Login tests need a logged-OUT browser, so we override it with an empty state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  // beforeEach runs before every test in this describe block.
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid credentials open the task list', async ({ loginPage, tasksPage }) => {
    await loginPage.login(testUser.email, testUser.password);

    // Web-first assertions (expect(locator).toBeX()) retry until they pass or time
    // out, so there's no need to sleep while the app logs in.
    await expect(tasksPage.heading).toBeVisible();
    await expect(loginPage.heading).toBeHidden();
  });

  test('wrong password shows an error and stays on the login screen', async ({ loginPage }) => {
    await loginPage.login(testUser.email, 'not-the-password');

    await expect(loginPage.formError).toHaveText('Invalid email or password');
    await expect(loginPage.heading).toBeVisible();
  });

  test('unknown user is rejected', async ({ loginPage }) => {
    await loginPage.login('nobody@tasklane.test', testUser.password);

    await expect(loginPage.formError).toHaveText('Invalid email or password');
  });

  test('logging out returns to the login screen', async ({ loginPage, tasksPage }) => {
    await loginPage.login(testUser.email, testUser.password);
    await tasksPage.logoutButton.click();

    await expect(loginPage.heading).toBeVisible();
  });

  test.describe('client-side validation', () => {
    // Data-driven test: one table of cases, one test generated per row.
    // Adding a scenario means adding a row, not copying a test.
    const cases = [
      { name: 'empty form', email: '', password: '', emailError: 'Email is required', passwordError: 'Password is required' },
      { name: 'malformed email', email: 'demo@', password: 'whatever123', emailError: 'Enter a valid email address', passwordError: '' },
      { name: 'short password', email: 'demo@tasklane.test', password: 'short', emailError: '', passwordError: 'Password must be at least 8 characters' },
    ];

    for (const c of cases) {
      // Test titles must be unique, so include the case name.
      test(`shows inline errors for ${c.name}`, async ({ loginPage, page }) => {
        // Watch the network: invalid input should never reach the server.
        let loginRequests = 0;
        page.on('request', (req) => {
          if (req.url().endsWith('/api/login')) loginRequests++;
        });

        await loginPage.login(c.email, c.password);

        // toHaveText('') also passes when the element is empty, i.e. no error shown.
        await expect(loginPage.emailError).toHaveText(c.emailError);
        await expect(loginPage.passwordError).toHaveText(c.passwordError);

        // aria-invalid is how screen readers learn a field has an error.
        await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', String(Boolean(c.emailError)));
        await expect(loginPage.passwordInput).toHaveAttribute('aria-invalid', String(Boolean(c.passwordError)));

        expect(loginRequests).toBe(0);
      });
    }
  });
});
