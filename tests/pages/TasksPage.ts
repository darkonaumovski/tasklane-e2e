import { expect, type Locator, type Page } from '@playwright/test';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TaskRow } from '../components/TaskRow';
import type { StatusFilter } from '../types/task';

/** Page Object for the task list screen. Row-level actions live in TaskRow. */
export class TasksPage {
  readonly region: Locator;
  readonly heading: Locator;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly loadingStatus: Locator;
  readonly errorMessage: Locator;
  readonly taskList: Locator;
  readonly taskItems: Locator;
  readonly taskTitles: Locator;
  readonly emptyState: Locator;
  readonly logoutButton: Locator;
  readonly deleteDialog: ConfirmDialog;

  constructor(readonly page: Page) {
    this.region = page.getByRole('region', { name: 'My tasks', exact: true });
    this.heading = this.region.getByRole('heading', { name: 'My tasks', exact: true });
    this.newTaskInput = this.region.getByLabel('New task', { exact: true });
    this.addButton = this.region.getByRole('button', { name: 'Add task', exact: true });
    this.searchInput = this.region.getByRole('searchbox', { name: 'Search', exact: true });
    this.statusFilter = this.region.getByRole('combobox', { name: 'Status', exact: true });
    this.loadingStatus = this.region.getByRole('status');
    this.errorMessage = this.region.getByRole('alert');
    this.taskList = this.region.getByRole('list', { name: 'Tasks', exact: true });
    this.taskItems = this.taskList.getByRole('listitem');
    // A title is a <label>, which has no role of its own: test id is the clear fallback
    // for "just the titles, in order".
    this.taskTitles = this.taskList.getByTestId('task-title');
    this.emptyState = this.region.getByText('No tasks match.', { exact: true });
    this.logoutButton = this.region.getByRole('button', { name: 'Log out', exact: true });
    // The modal lives outside the region (it's a top-layer <dialog>), so it gets the page.
    this.deleteDialog = new ConfirmDialog(page, 'Delete task?', 'Delete');
  }

  /** Opens the app and waits until GET /api/tasks (1-2 s on the real server) has finished. */
  async goto() {
    await this.page.goto('/');
    await this.waitForTasksLoaded();
  }

  /**
   * The app sets aria-busy="false" on the list once loading finishes, successfully or not.
   * Waiting on that real signal instead of a fixed sleep is never too short on a slow
   * machine and never wastes time on a fast one.
   */
  async waitForTasksLoaded() {
    await expect(this.taskList).toHaveAttribute('aria-busy', 'false');
  }

  task(title: string): TaskRow {
    return new TaskRow(this.taskList, title);
  }

  async addTask(title: string) {
    await this.newTaskInput.fill(title);
    await this.addButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByStatus(status: StatusFilter) {
    await this.statusFilter.selectOption(status);
  }
}
