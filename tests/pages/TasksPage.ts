import { expect, type Locator, type Page } from '@playwright/test';
import type { StatusFilter } from '../support/test-data';

/** A file built in memory, so tests don't need fixture files on disk. */
export type InMemoryFile = { name: string; mimeType: string; buffer: Buffer };

/** Page Object for the task list screen. */
export class TasksPage {
  readonly heading: Locator;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly taskList: Locator;
  readonly taskItems: Locator;
  readonly taskTitles: Locator;
  readonly errorMessage: Locator;
  readonly emptyState: Locator;
  readonly logoutButton: Locator;
  readonly deleteDialog: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My tasks' });
    this.newTaskInput = page.getByLabel('New task');
    this.addButton = page.getByRole('button', { name: 'Add task' });
    this.searchInput = page.getByRole('searchbox', { name: 'Search' });
    this.statusFilter = page.getByLabel('Status');
    this.taskList = page.getByRole('list', { name: 'Tasks' });

    // Chaining narrows the search: list items *inside* the task list only.
    this.taskItems = this.taskList.getByRole('listitem');

    // The title <label> is shared by several roles, so a test id is the clearest
    // way to grab "just the titles" for list comparisons.
    this.taskTitles = this.taskList.getByTestId('task-title');

    this.errorMessage = page.getByRole('alert');
    this.emptyState = page.getByTestId('empty-state');
    this.logoutButton = page.getByRole('button', { name: 'Log out' });

    // <dialog> opened with showModal() has role "dialog", named by its heading.
    this.deleteDialog = page.getByRole('dialog', { name: 'Delete task?' });
  }

  /** Opens the app and waits until the slow GET /api/tasks call has finished. */
  async goto() {
    await this.page.goto('/');
    await this.waitForTasksLoaded();
  }

  /**
   * The app sets aria-busy="false" on the list once tasks have loaded (1-2 s).
   * Waiting on that real signal replaces a fixed waitForTimeout(2000): it's never
   * too short on a slow machine, and never wastes time on a fast one.
   */
  async waitForTasksLoaded() {
    await expect(this.taskList).toHaveAttribute('aria-busy', 'false');
  }

  /** One task row, found by its visible title. */
  task(title: string): Locator {
    return this.taskItems.filter({ hasText: title });
  }

  /** The "done" checkbox. Its accessible name is the task title, via <label for>. */
  checkbox(title: string): Locator {
    return this.page.getByRole('checkbox', { name: title, exact: true });
  }

  async addTask(title: string) {
    await this.newTaskInput.fill(title);
    await this.addButton.click();
  }

  async editTask(currentTitle: string, newTitle: string) {
    // Scoping to the row means "the Edit button of *this* task", not the first one on the page.
    await this.task(currentTitle).getByRole('button', { name: 'Edit' }).click();
    // In edit mode the row is redrawn, so we look up the edit box by its label.
    const input = this.page.getByRole('textbox', { name: 'Edit title' });
    await input.fill(newTitle);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async attachFile(title: string, file: InMemoryFile) {
    // setInputFiles works even though the real <input type=file> is visually hidden.
    await this.task(title).getByLabel(`Attach file to ${title}`).setInputFiles(file);
  }

  async openDeleteDialog(title: string) {
    await this.task(title).getByRole('button', { name: 'Delete' }).click();
    await expect(this.deleteDialog).toBeVisible();
  }

  async confirmDelete() {
    await this.deleteDialog.getByRole('button', { name: 'Delete' }).click();
  }

  async cancelDelete() {
    await this.deleteDialog.getByRole('button', { name: 'Cancel' }).click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByStatus(status: StatusFilter) {
    // selectOption accepts the <option value="...">.
    await this.statusFilter.selectOption(status);
  }
}
