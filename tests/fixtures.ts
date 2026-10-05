import { test as base } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { TasksPage } from './pages/TasksPage';

/**
 * Custom fixtures.
 *
 * A fixture is something a test receives as an argument: `async ({ page }) => ...`.
 * Playwright creates it before the test and cleans it up afterwards. Here we add
 * our own fixtures on top of the built-in ones, so specs can write:
 *
 *   test('...', async ({ tasksPage }) => { ... })
 *
 * instead of `new TasksPage(page)` at the top of every test.
 *
 * Specs import `test` and `expect` from THIS file, not from '@playwright/test'.
 */
type Fixtures = {
  loginPage: LoginPage;
  tasksPage: TasksPage;
  resetData: void;
};

export const test = base.extend<Fixtures>({
  // Overrides a built-in option. Every request from this test (the page's fetch()
  // calls and the `request` fixture) carries a header unique to the test.
  // The server keeps a separate copy of the data per header value, so tests can run
  // in parallel without one test's "delete" breaking another test's assertions.
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use, testInfo) => {
    await use({ ...extraHTTPHeaders, 'x-test-namespace': `${testInfo.project.name}-${testInfo.testId}` });
  },

  // `auto: true` runs this before every test, even tests that don't ask for it.
  // A retried test reuses its namespace, so we reset to the seed data every time.
  resetData: [
    async ({ request }, use) => {
      const response = await request.post('/api/reset');
      if (!response.ok()) throw new Error(`POST /api/reset failed with ${response.status()}`);
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  },
});

export { expect } from '@playwright/test';
