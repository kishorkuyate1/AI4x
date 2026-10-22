import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test.describe('OrangeHRM PIM', () => {
  test('saves a new employee and shows the profile name', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const addEmployeePage = new AddEmployeePage(page);
    const employeeProfilePage = new EmployeeProfilePage(page);

    await loginPage.open();
    await loginPage.login('Admin', 'admin123');
    await expect(page).toHaveURL(/\/dashboard\/index/);

    await dashboardPage.openPim();
    await addEmployeePage.open();
    await expect(page).toHaveURL(/\/pim\/addEmployee/);

    await addEmployeePage.saveEmployee('John123', 'Doe456');

    await expect(page).toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
    await expect(employeeProfilePage.heading('John123 Doe456')).toBeVisible();
  });
});
