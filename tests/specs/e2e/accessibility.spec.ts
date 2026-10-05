import { test, expect } from '../../fixtures';

/**
 * Automated WCAG 2.1 AA scans with axe-core, one per meaningful UI state.
 * Axe finds roughly a third of accessibility issues (contrast, names, roles, ARIA
 * misuse); keyboard flows like the modal focus test still need explicit tests.
 *
 * `violations` is compared to [] so a failure prints every rule, node and fix hint.
 */
test.describe('Accessibility', { tag: ['@e2e', '@a11y'] }, () => {
  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('the login screen has no WCAG A/AA violations', async ({ loginPage, makeAxeBuilder }) => {
      await loginPage.goto();

      const results = await makeAxeBuilder().analyze();

      expect(results.violations).toEqual([]);
    });

    test('the login screen with validation errors has no violations', async ({ loginPage, makeAxeBuilder }) => {
      await loginPage.goto();
      await loginPage.loginAs({ email: 'demo@', password: '' });
      await expect(loginPage.emailInput).toHaveAccessibleDescription('Enter a valid email address');

      const results = await makeAxeBuilder().analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test('the task list, including done tasks and attachments, has no violations', async ({
    tasksPage,
    makeAxeBuilder,
  }) => {
    await tasksPage.goto();
    await tasksPage
      .task('Buy groceries')
      .attach({ name: 'list.txt', mimeType: 'text/plain', buffer: Buffer.from('milk') });
    await expect(tasksPage.task('Buy groceries').attachment).toBeVisible();

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });

  test('the open delete modal has no violations', async ({ tasksPage, makeAxeBuilder }) => {
    await tasksPage.goto();
    await tasksPage.task('Buy groceries').deleteButton.click();
    await expect(tasksPage.deleteDialog.root).toBeVisible();

    // Scan only the modal: the page behind it is inert while the modal is open.
    const results = await makeAxeBuilder().include('dialog').analyze();

    expect(results.violations).toEqual([]);
  });
});
