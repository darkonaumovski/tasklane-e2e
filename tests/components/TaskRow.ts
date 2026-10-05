import type { Locator } from '@playwright/test';
import type { InMemoryFile } from '../types/files';

/**
 * One row of the task list. All row locators are scoped to the row, so "the Delete
 * button" always means this task's Delete button.
 */
export class TaskRow {
  readonly root: Locator;
  readonly checkbox: Locator;
  readonly title: Locator;
  readonly attachment: Locator;
  readonly attachInput: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(
    private readonly list: Locator,
    readonly name: string,
  ) {
    // The checkbox's accessible name is the task title (via <label for>). Matching it
    // exactly identifies one row; a text match like hasText: 'Plan' would match
    // "Write test plan" and "Plan team offsite".
    // `has` is searched *inside* each list item, so it must start from page(), not from `list`.
    const page = list.page();
    this.root = list.getByRole('listitem').filter({ has: page.getByRole('checkbox', { name, exact: true }) });
    this.checkbox = this.root.getByRole('checkbox', { name, exact: true });
    this.title = this.root.getByTestId('task-title');
    this.attachment = this.root.getByTestId('task-attachment');
    this.attachInput = this.root.getByLabel(`Attach file to ${name}`, { exact: true });
    this.editButton = this.root.getByRole('button', { name: `Edit ${name}`, exact: true });
    this.deleteButton = this.root.getByRole('button', { name: `Delete ${name}`, exact: true });
  }

  /** Edit mode replaces the row's label with a text box, so the edit form is found by its input. */
  async rename(newTitle: string) {
    await this.editButton.click();
    const editBox = { name: 'Edit title', exact: true };
    const editRow = this.list.getByRole('listitem').filter({ has: this.list.page().getByRole('textbox', editBox) });
    const titleInput = editRow.getByRole('textbox', editBox);
    await titleInput.fill(newTitle);
    await editRow.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async attach(file: InMemoryFile) {
    // setInputFiles works on the visually hidden <input type=file>, the way a file picker would.
    await this.attachInput.setInputFiles(file);
  }
}
