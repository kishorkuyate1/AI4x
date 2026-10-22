import { type Page } from '@playwright/test';

export class AddEmployeePage {
  constructor(private readonly page: Page) {}

  private readonly addEmployeeLink = this.page.getByRole('link', { name: 'Add Employee' });
  private readonly firstName = this.page.getByRole('textbox', { name: 'First Name' });
  private readonly lastName = this.page.getByRole('textbox', { name: 'Last Name' });
  private readonly employeeId = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.getByText('Employee Id', { exact: true }) })
    .locator('input');
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });

  async open() {
    await this.addEmployeeLink.click();
  }

  async saveEmployee(firstName: string, lastName: string) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    // The form pre-fills an Employee Id that can already exist. The label is not associated with the input.
    await this.employeeId.fill(`E${Date.now().toString().slice(-6)}`);
    await this.saveButton.click();
  }
}
