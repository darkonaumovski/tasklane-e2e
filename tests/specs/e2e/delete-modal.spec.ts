import { seedTask, seedTitles } from '../../data/seed-tasks';
import { test, expect } from '../../fixtures';

const target = seedTask('Book dentist appointment');

test.describe('Delete confirmation modal', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.task(target.title).deleteButton.click();
  });

  test('names the task and takes keyboard focus', async ({ tasksPage }) => {
    const dialog = tasksPage.deleteDialog;

    await expect(dialog.root).toBeVisible();
    await expect(dialog.message).toHaveText(`"${target.title}" will be permanently deleted.`);
    // A modal must take focus, or keyboard users would keep acting on the page behind it.
    await expect(dialog.cancelButton).toBeFocused();
  });

  test('Cancel closes the modal and keeps the task', async ({ tasksPage }) => {
    await tasksPage.deleteDialog.cancel();

    await expect(tasksPage.deleteDialog.root).toBeHidden();
    await expect(tasksPage.taskTitles).toHaveText(seedTitles);
  });

  test('Escape closes the modal and keeps the task', async ({ tasksPage, page }) => {
    await page.keyboard.press('Escape');

    await expect(tasksPage.deleteDialog.root).toBeHidden();
    await expect(tasksPage.taskTitles).toHaveText(seedTitles);
  });

  test('Delete removes the task on the server and in the list', { tag: '@smoke' }, async ({ tasksPage, page }) => {
    // Start waiting BEFORE the click: a fast response could otherwise arrive before we listen.
    const deleteResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' && new URL(response.url()).pathname === `/api/tasks/${target.id}`,
    );
    await tasksPage.deleteDialog.confirm();
    expect((await deleteResponse).status()).toBe(204);

    await expect(tasksPage.deleteDialog.root).toBeHidden();
    await expect(tasksPage.taskTitles).toHaveText(seedTitles.filter((title) => title !== target.title));
  });
});
