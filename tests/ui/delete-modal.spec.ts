import { test, expect } from '../fixtures';

test.describe('Delete confirmation modal', () => {
  const title = 'Book dentist appointment';

  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.openDeleteDialog(title);
  });

  test('names the task and moves focus into the dialog', async ({ tasksPage }) => {
    await expect(tasksPage.deleteDialog).toContainText(`"${title}" will be permanently deleted.`);
    // A modal should take keyboard focus, so keyboard users don't act on the page behind it.
    await expect(tasksPage.deleteDialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  });

  test('Cancel keeps the task', async ({ tasksPage }) => {
    await tasksPage.cancelDelete();

    await expect(tasksPage.deleteDialog).toBeHidden();
    await expect(tasksPage.task(title)).toBeVisible();
  });

  test('Escape key closes the dialog without deleting', async ({ tasksPage, page }) => {
    await page.keyboard.press('Escape');

    await expect(tasksPage.deleteDialog).toBeHidden();
    await expect(tasksPage.task(title)).toBeVisible();
  });

  test('Delete removes the task', async ({ tasksPage, page }) => {
    // waitForResponse is set up BEFORE the click, then awaited after. If we started
    // waiting after the click, a fast response could arrive before we start listening.
    const deleted = page.waitForResponse((res) => res.request().method() === 'DELETE');
    await tasksPage.confirmDelete();
    expect((await deleted).status()).toBe(204);

    await expect(tasksPage.deleteDialog).toBeHidden();
    await expect(tasksPage.task(title)).toHaveCount(0);
    await expect(tasksPage.taskItems).toHaveCount(4);
  });
});
