import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { testUser } from './support/test-data';

// Must match `storageState` in playwright.config.ts.
const authFile = 'playwright/.auth/user.json';

/**
 * Runs once, before the browser projects (they list 'setup' in `dependencies`).
 *
 * Logging in through the UI in every test would be slow and would test the
 * login screen 50 times. Instead we log in once, save the session cookie to
 * a file, and every UI test starts from that file already logged in.
 */
setup('log in and save session', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);

  // Wait until login has really finished before saving, or we might save
  // the state from before the session cookie was set.
  await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
