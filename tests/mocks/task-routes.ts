import type { Page, Route } from '@playwright/test';

/**
 * Intercepts only GET /api/tasks. A URL glob alone would also catch POST /api/tasks
 * and silently break "add task" in the same test, so other methods fall through.
 *
 * Routes belong to the test's page, which is closed after every test, so mocks never
 * leak into other tests. Register the route before the navigation that triggers it.
 */
export async function routeTaskList(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(
    (url) => url.pathname === '/api/tasks',
    (route) => (route.request().method() === 'GET' ? handler(route) : route.fallback()),
  );
}
