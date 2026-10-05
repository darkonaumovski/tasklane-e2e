import AxeBuilder from '@axe-core/playwright';
import { test as base } from '@playwright/test';
import { TasksApiClient } from '../api/TasksApiClient';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { TasksPage } from '../pages/TasksPage';

/**
 * Typed custom fixtures. Specs import `test` and `expect` from here, never from
 * '@playwright/test', and receive what they need as arguments:
 *
 *   test('...', async ({ tasksPage, tasksApi }) => { ... })
 *
 * Every fixture is test-scoped: nothing mutable is shared between tests.
 */
type Fixtures = {
  /** Page Object for the sign-in screen. */
  loginPage: LoginPage;
  /** Page Object for the task list screen. */
  tasksPage: TasksPage;
  /** API client with its own logged-in session, for arranging or verifying data. */
  tasksApi: TasksApiClient;
  /** Auto fixture: resets this test's data before it runs. */
  resetData: void;
  /** Returns an axe scanner preconfigured with the WCAG level this project targets. */
  makeAxeBuilder: () => AxeBuilder;
};

/** WCAG 2.1 A and AA: the level most accessibility regulations reference. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export const test = base.extend<Fixtures>({
  // Test isolation. Every request from this test (the page's fetch calls and the
  // `request` fixture) carries a header unique to the test. The server keeps one copy
  // of the data per header value, so parallel tests never see each other's changes.
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use, testInfo) => {
    await use({ ...extraHTTPHeaders, 'x-test-namespace': `${testInfo.project.name}-${testInfo.testId}` });
  },

  // A retry reuses the same namespace, so start from the seed data every time.
  resetData: [
    async ({ request }, use) => {
      const response = await new TasksApiClient(request).reset();
      if (!response.ok()) throw new Error(`POST /api/reset failed with ${response.status()}`);
      await use();
    },
    { auto: true },
  ],

  tasksApi: async ({ request }, use) => {
    const api = new TasksApiClient(request);
    await api.loginAs(env.user);
    await use(api);
  },

  // A factory, not a single builder: a test may scan several states (list, then open modal).
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(WCAG_TAGS));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  },
});

export { expect } from '@playwright/test';
