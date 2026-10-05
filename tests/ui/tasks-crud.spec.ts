import { test, expect } from '../fixtures';
import { seedTitles } from '../support/test-data';

test.describe('Task CRUD', () => {
  test.beforeEach(async ({ tasksPage }) => {
    // Already logged in via storageState; just open the app and wait for the data.
    await tasksPage.goto();
  });

  test('shows the seeded tasks after loading', async ({ tasksPage }) => {
    // Passing an array checks the count, the order and each text in one assertion.
    await expect(tasksPage.taskTitles).toHaveText(seedTitles);
  });

  test('adds a task', async ({ tasksPage }) => {
    await tasksPage.addTask('Learn Playwright fixtures');

    await expect(tasksPage.task('Learn Playwright fixtures')).toBeVisible();
    await expect(tasksPage.taskItems).toHaveCount(seedTitles.length + 1);
    // The input is cleared, ready for the next task.
    await expect(tasksPage.newTaskInput).toHaveValue('');
  });

  test('does not add an empty task', async ({ tasksPage }) => {
    await tasksPage.addTask('   ');

    await expect(tasksPage.errorMessage).toHaveText('Task title is required');
    await expect(tasksPage.taskItems).toHaveCount(seedTitles.length);
  });

  test('a new task survives a page reload', async ({ tasksPage, page }) => {
    await tasksPage.addTask('Persisted on the server');
    // Wait for the UI to confirm the add before reloading, or we could reload too early.
    await expect(tasksPage.task('Persisted on the server')).toBeVisible();

    await page.reload();
    await tasksPage.waitForTasksLoaded();

    await expect(tasksPage.task('Persisted on the server')).toBeVisible();
  });

  test('edits a task title', async ({ tasksPage }) => {
    await tasksPage.editTask('Buy groceries', 'Buy groceries and coffee');

    // The edited task keeps its position; nothing else changes.
    await expect(tasksPage.taskTitles).toHaveText(['Buy groceries and coffee', ...seedTitles.slice(1)]);
  });

  test('marks a task as done and back to open', async ({ tasksPage }) => {
    const checkbox = tasksPage.checkbox('Review pull request');
    await expect(checkbox).not.toBeChecked();

    // check()/uncheck() are safer than click(): they verify the final state.
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(tasksPage.task('Review pull request')).toHaveClass(/done/);

    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('attaches a file to a task', async ({ tasksPage }) => {
    await tasksPage.attachFile('Write test plan', {
      name: 'test-plan.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Scope, risks, schedule'),
    });

    await expect(tasksPage.task('Write test plan').getByTestId('task-attachment')).toHaveText('📎 test-plan.txt');
  });
});
