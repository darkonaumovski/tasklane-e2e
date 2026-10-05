import type { Locator, Page } from '@playwright/test';

/**
 * A native <dialog> confirmation modal, identified by its heading.
 * Reusable for any confirm/cancel modal: new ConfirmDialog(page, 'Archive list?', 'Archive').
 */
export class ConfirmDialog {
  readonly root: Locator;
  readonly message: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page, title: string, confirmLabel: string) {
    // showModal() gives the <dialog> role "dialog", named by aria-labelledby (its heading).
    this.root = page.getByRole('dialog', { name: title, exact: true });
    // The body text is a plain <p> with no role or label, so a test id is the honest fallback.
    this.message = this.root.getByTestId('confirm-text');
    this.confirmButton = this.root.getByRole('button', { name: confirmLabel, exact: true });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel', exact: true });
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
