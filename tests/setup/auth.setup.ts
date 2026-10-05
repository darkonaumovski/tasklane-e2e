import { test as setup, expect } from '@playwright/test';
import { env, paths } from '../config/env';
import { LoginPage } from '../pages/LoginPage';

/**
 * Runs once before the browser projects (they list 'setup' in `dependencies`).
 * It logs in through the real UI, then saves the session cookie so every UI test
 * starts already logged in instead of repeating the login form.
 */
setup('log in and save the session', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAs(env.user);

  // Save only after login has really finished, or we'd store a logged-out state.
  await expect(page.getByRole('heading', { name: 'My tasks', exact: true })).toBeVisible();
  await page.context().storageState({ path: paths.storageState });
});
