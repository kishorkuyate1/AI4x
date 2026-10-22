import { type Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  private readonly pimLink = this.page.getByRole('link', { name: 'PIM' });

  async openPim() {
    await this.pimLink.click();
  }
}
