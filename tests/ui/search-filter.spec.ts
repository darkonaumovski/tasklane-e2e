import { test, expect } from '../fixtures';
import type { StatusFilter } from '../support/test-data';

// Each row is one scenario. `expected` is the exact list of titles, in order.
// The type annotation makes TypeScript reject a typo like status: 'closed'.
type FilterCase = { search: string; status: StatusFilter; expected: string[] };

const cases: FilterCase[] = [
  { search: '', status: 'all', expected: ['Buy groceries', 'Write test plan', 'Review pull request', 'Book dentist appointment', 'Plan team offsite'] },
  { search: '', status: 'open', expected: ['Buy groceries', 'Review pull request', 'Plan team offsite'] },
  { search: '', status: 'done', expected: ['Write test plan', 'Book dentist appointment'] },
  { search: 'plan', status: 'all', expected: ['Write test plan', 'Plan team offsite'] },
  { search: 'PLAN', status: 'open', expected: ['Plan team offsite'] },
  { search: 'plan', status: 'done', expected: ['Write test plan'] },
  { search: '  review ', status: 'all', expected: ['Review pull request'] },
  { search: 'groceries', status: 'done', expected: [] },
];

test.describe('Search and status filter', () => {
  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
  });

  for (const { search, status, expected } of cases) {
    test(`search "${search}" with status "${status}" shows ${expected.length} task(s)`, async ({ tasksPage }) => {
      await tasksPage.search(search);
      await tasksPage.filterByStatus(status);

      await expect(tasksPage.taskTitles).toHaveText(expected);

      // The "No tasks match" message appears only when the list is empty.
      if (expected.length === 0) {
        await expect(tasksPage.emptyState).toBeVisible();
      } else {
        await expect(tasksPage.emptyState).toBeHidden();
      }
    });
  }

  test('clearing the search shows all tasks again', async ({ tasksPage }) => {
    await tasksPage.search('dentist');
    await expect(tasksPage.taskItems).toHaveCount(1);

    await tasksPage.searchInput.clear();
    await expect(tasksPage.taskItems).toHaveCount(5);
  });
});
