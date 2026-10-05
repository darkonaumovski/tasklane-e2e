import type { Page, Route } from '@playwright/test';
import { seedTitles } from '../../data/seed-tasks';
import { buildTask } from '../../factories/task.factory';
import { test, expect } from '../../fixtures';
import type { Task } from '../../types/task';

/**
 * Mocked UI tests: the browser's network calls are intercepted with page.route(), so
 * these check how the front end handles responses that are hard to produce for real.
 * They do not prove the server works; the API and e2e specs do that.
 *
 * Routes belong to the test's page, which is closed after every test, so mocks never
 * leak into other tests.
 */

/**
 * Intercepts only GET /api/tasks. A URL glob alone would also catch POST /api/tasks
 * and silently break "add task" in the same test, so other methods fall through.
 */
async function routeTaskList(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(
    (url) => url.pathname === '/api/tasks',
    (route) => (route.request().method() === 'GET' ? handler(route) : route.fallback()),
  );
}

test.describe('Task list with a mocked network', { tag: '@mocked' }, () => {
  test('renders exactly the tasks the API returns', async ({ page, tasksPage }) => {
    const tasks = [
      buildTask({ title: 'Mocked open task' }),
      buildTask({ title: 'Mocked done task', done: true, attachment: 'spec.pdf' }),
    ];
    // Register the route BEFORE the navigation that triggers the request.
    await routeTaskList(page, (route) => route.fulfill({ json: tasks }));

    await tasksPage.goto();

    await expect(tasksPage.taskTitles).toHaveText(['Mocked open task', 'Mocked done task']);
    await expect(tasksPage.task('Mocked done task').checkbox).toBeChecked();
    await expect(tasksPage.task('Mocked done task').attachment).toHaveText('📎 spec.pdf');
  });

  test('an empty list shows the empty state', async ({ page, tasksPage }) => {
    await routeTaskList(page, (route) => route.fulfill({ json: [] }));

    await tasksPage.goto();

    await expect(tasksPage.taskItems).toHaveCount(0);
    await expect(tasksPage.emptyState).toBeVisible();
  });

  test('a server error shows the API error message', async ({ page, tasksPage }) => {
    await routeTaskList(page, (route) => route.fulfill({ status: 500, json: { error: 'Database unavailable' } }));

    await tasksPage.goto();

    await expect(tasksPage.errorMessage).toHaveText('Database unavailable');
    await expect(tasksPage.taskItems).toHaveCount(0);
  });

  test('a network failure shows a friendly error', async ({ page, tasksPage }) => {
    // abort() simulates the request never reaching the server (offline, DNS, CORS).
    await routeTaskList(page, (route) => route.abort('failed'));

    await tasksPage.goto();

    await expect(tasksPage.errorMessage).toHaveText('Network error. Check your connection and try again.');
  });

  test('a slow response shows the loading state until data arrives', async ({ page, tasksPage }) => {
    // Hold the response until the test releases it: full control over timing, no sleeps.
    let releaseResponse!: () => void;
    const responseReleased = new Promise<void>((resolve) => (releaseResponse = resolve));
    await routeTaskList(page, async (route) => {
      await responseReleased;
      await route.fulfill({ json: [buildTask({ title: 'Arrived late' })] });
    });

    await page.goto('/');
    await expect(tasksPage.loadingStatus).toHaveText('Loading tasks…');
    await expect(tasksPage.taskList).toHaveAttribute('aria-busy', 'true');

    releaseResponse();

    await expect(tasksPage.loadingStatus).toBeHidden();
    await expect(tasksPage.taskTitles).toHaveText(['Arrived late']);
  });

  test('route.fetch() can patch a real server response', async ({ page, tasksPage }) => {
    // Let the real request through, then add one task to what the server sent back.
    await routeTaskList(page, async (route) => {
      const response = await route.fetch();
      const realTasks = (await response.json()) as Task[];
      await route.fulfill({ response, json: [...realTasks, buildTask({ title: 'Injected by the test' })] });
    });

    await tasksPage.goto();

    await expect(tasksPage.taskTitles).toHaveText([...seedTitles, 'Injected by the test']);
  });
});

test.describe('Requests sent by the UI', { tag: '@mocked' }, () => {
  test('adding a task sends the trimmed title', async ({ page, tasksPage }) => {
    await tasksPage.goto();
    // Observe the real request without mocking it; registered before the action.
    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && new URL(request.url()).pathname === '/api/tasks',
    );

    await tasksPage.addTask('   Trimmed title   ');

    expect((await createRequest).postDataJSON()).toEqual({ title: 'Trimmed title' });
  });
});
