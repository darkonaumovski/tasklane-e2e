import { test, expect } from '../fixtures';

/**
 * page.route() intercepts requests in the browser before they reach the server.
 * That lets us test states that are hard to produce for real (a server error, an
 * unusual data set) and skip the 1-2 s delay. These tests check the front end
 * alone; the API tests check the real server.
 */
test.describe('Mocked network', () => {
  test('renders whatever the API returns', async ({ page, tasksPage }) => {
    // Register the route BEFORE navigating, so the very first request is caught.
    await page.route('**/api/tasks', async (route) => {
      await route.fulfill({
        json: [
          { id: 101, title: 'Mocked open task', done: false, attachment: null },
          { id: 102, title: 'Mocked done task', done: true, attachment: 'spec.pdf' },
        ],
      });
    });

    await tasksPage.goto();

    await expect(tasksPage.taskTitles).toHaveText(['Mocked open task', 'Mocked done task']);
    await expect(tasksPage.checkbox('Mocked done task')).toBeChecked();
    await expect(tasksPage.task('Mocked done task').getByTestId('task-attachment')).toHaveText('📎 spec.pdf');
  });

  test('shows an error when the API fails', async ({ page, tasksPage }) => {
    await page.route('**/api/tasks', (route) =>
      route.fulfill({ status: 500, json: { error: 'Database unavailable' } }),
    );

    await tasksPage.goto();

    await expect(tasksPage.errorMessage).toHaveText('Database unavailable');
    await expect(tasksPage.taskItems).toHaveCount(0);
  });
});
