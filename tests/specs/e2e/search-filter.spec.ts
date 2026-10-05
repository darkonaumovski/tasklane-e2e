import { seedTitles } from '../../data/seed-tasks';
import { test, expect } from '../../fixtures';
import type { StatusFilter } from '../../types/task';

// Expected titles are written out by hand rather than computed from the seed data:
// a test that re-implements the filter would share any bug in it.
const cases: { search: string; status: StatusFilter; expected: string[] }[] = [
  { search: '', status: 'all', expected: seedTitles },
  { search: '', status: 'open', expected: ['Buy groceries', 'Review pull request', 'Plan team offsite'] },
  { search: '', status: 'done', expected: ['Write test plan', 'Book dentist appointment'] },
  { search: 'plan', status: 'all', expected: ['Write test plan', 'Plan team offsite'] },
  { search: 'PLAN', status: 'open', expected: ['Plan team offsite'] },
  { search: 'plan', status: 'done', expected: ['Write test plan'] },
  { search: '  review ', status: 'all', expected: ['Review pull request'] },
  { search: 'groceries', status: 'done', expected: [] },
];

test.describe('Search and status filter', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
  });

  for (const { search, status, expected } of cases) {
    test(`search "${search}" + status "${status}" lists ${expected.length} task(s)`, async ({ tasksPage }) => {
      await tasksPage.search(search);
      await tasksPage.filterByStatus(status);

      await expect(tasksPage.taskTitles).toHaveText(expected);
      // `visible: false` asserts hidden, so one line covers both cases without an if.
      await expect(tasksPage.emptyState).toBeVisible({ visible: expected.length === 0 });
    });
  }

  test('clearing the search shows every task again', async ({ tasksPage }) => {
    await tasksPage.search('dentist');
    await expect(tasksPage.taskTitles).toHaveText(['Book dentist appointment']);

    await tasksPage.searchInput.clear();

    await expect(tasksPage.taskTitles).toHaveText(seedTitles);
  });
});
