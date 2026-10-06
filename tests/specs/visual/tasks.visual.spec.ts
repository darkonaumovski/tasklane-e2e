import { buildTask } from '../../factories/task.factory';
import { test, expect } from '../../fixtures';
import { routeTaskList } from '../../mocks/task-routes';

/**
 * Visual regression: compares screenshots with committed baselines.
 *
 * Fonts and anti-aliasing differ between operating systems, so baselines are rendered
 * on Linux only, the same OS as CI. On Windows or macOS these tests are skipped
 * rather than failing on a missing baseline. To create or refresh baselines, add the
 * `update-snapshots` label to the pull request, or run that workflow manually from the
 * Actions tab (see .github/workflows/update-snapshots.yml).
 *
 * Data is mocked so every run renders exactly the same content.
 */
test.skip(process.platform !== 'linux', 'Visual baselines are rendered on Linux, the same OS as CI');

const fixedTasks = [
  buildTask({ title: 'Buy groceries' }),
  buildTask({ title: 'Write test plan', done: true }),
  buildTask({ title: 'Review pull request', attachment: 'diff.patch' }),
];

test.describe('Visual regression', { tag: '@visual' }, () => {
  test('task list', async ({ page, tasksPage }) => {
    await routeTaskList(page, (route) => route.fulfill({ json: fixedTasks }));
    await tasksPage.goto();
    await expect(tasksPage.taskTitles).toHaveCount(fixedTasks.length);

    await expect(tasksPage.region).toHaveScreenshot('task-list.png');
  });

  test('delete confirmation modal', async ({ page, tasksPage }) => {
    await routeTaskList(page, (route) => route.fulfill({ json: fixedTasks }));
    await tasksPage.goto();
    await tasksPage.task('Buy groceries').deleteButton.click();
    await expect(tasksPage.deleteDialog.cancelButton).toBeFocused();

    // The whole viewport, so the dimmed backdrop is part of the comparison.
    await expect(page).toHaveScreenshot('delete-modal.png');
  });

  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login form with validation errors', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.loginAs({ email: 'demo@', password: '' });
      await expect(loginPage.passwordInput).toHaveAccessibleDescription('Password is required');

      await expect(loginPage.region).toHaveScreenshot('login-errors.png');
    });
  });
});
