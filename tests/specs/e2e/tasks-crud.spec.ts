import { seedTitles } from '../../data/seed-tasks';
import { test, expect } from '../../fixtures';

test.describe('Task CRUD', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
  });

  test('the seeded tasks are listed after loading', { tag: '@smoke' }, async ({ tasksPage }) => {
    // An array checks the count, the order and every title in one assertion.
    await expect(tasksPage.taskTitles).toHaveText(seedTitles);
  });

  test('adding a task appends it and clears the input', { tag: '@smoke' }, async ({ tasksPage }) => {
    await tasksPage.addTask('Learn Playwright fixtures');

    await expect(tasksPage.taskTitles).toHaveText([...seedTitles, 'Learn Playwright fixtures']);
    await expect(tasksPage.newTaskInput).toHaveValue('');
  });

  test('a blank title is rejected', async ({ tasksPage }) => {
    await tasksPage.addTask('   ');

    await expect(tasksPage.errorMessage).toHaveText('Task title is required');
    await expect(tasksPage.taskTitles).toHaveText(seedTitles);
  });

  test('a new task is saved on the server and survives a reload', async ({ tasksPage, page }) => {
    await tasksPage.addTask('Persisted on the server');
    // Wait for the UI to confirm the add, or the reload could race the POST.
    await expect(tasksPage.task('Persisted on the server').root).toBeVisible();

    await page.reload();
    await tasksPage.waitForTasksLoaded();

    await expect(tasksPage.task('Persisted on the server').root).toBeVisible();
  });

  test('renaming a task keeps its position', async ({ tasksPage }) => {
    await tasksPage.task('Buy groceries').rename('Buy groceries and coffee');

    await expect(tasksPage.taskTitles).toHaveText(['Buy groceries and coffee', ...seedTitles.slice(1)]);
  });

  test('marking a task done is saved on the server', async ({ tasksPage, tasksApi }) => {
    const row = tasksPage.task('Review pull request');

    await row.checkbox.check();
    await expect(row.checkbox).toBeChecked();

    // The checkbox flips before the PUT finishes, so poll the server until it agrees
    // instead of reading it once and racing the request.
    const isDoneOnServer = async () =>
      (await tasksApi.listTasks()).find((task) => task.title === 'Review pull request')?.done;
    await expect.poll(isDoneOnServer).toBe(true);

    await row.checkbox.uncheck();
    await expect.poll(isDoneOnServer).toBe(false);
  });

  test('attaching a file shows its name on the task', async ({ tasksPage }) => {
    const row = tasksPage.task('Write test plan');

    await row.attach({ name: 'test-plan.txt', mimeType: 'text/plain', buffer: Buffer.from('Scope, risks') });

    await expect(row.attachment).toHaveText('📎 test-plan.txt');
  });

  test('a task created through the API appears in the UI', async ({ tasksApi, tasksPage, page }) => {
    // Arrange through the API (fast), assert through the UI (what the user sees).
    await tasksApi.createTask({ title: 'Created by the API' });

    await page.reload();
    await tasksPage.waitForTasksLoaded();

    await expect(tasksPage.task('Created by the API').root).toBeVisible();
  });
});
