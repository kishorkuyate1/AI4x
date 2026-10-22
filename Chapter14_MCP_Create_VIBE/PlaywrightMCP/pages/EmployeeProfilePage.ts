import { type Page } from '@playwright/test';

export class EmployeeProfilePage {
  constructor(private readonly page: Page) {}

  heading(name: string) {
    return this.page.getByRole('heading', { name });
  }
}
