# Playwright MCP Test Prompts (OrangeHRM)

## Prompt 1: Login Functionality

Generate a Playwright test for the following scenario:

1. Navigate to https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
2. Enter username "Admin"
3. Enter password "admin123"
4. Click on Login button
5. Verify that the dashboard page is displayed

---

## Prompt 2: Logout Functionality

Generate a Playwright test for the following scenario:

1. Login to https://opensource-demo.orangehrmlive.com/web/index.php/auth/login with username "Admin" and password "admin123"
2. Click on the user profile icon in the top-right corner
3. Click on "Logout"
4. Verify that the login page is displayed
5. Verify that the page contains "Username" field

---

## Prompt 3: Search Employee (PIM Module)

Generate a Playwright test for the following scenario:

1. Navigate to https://opensource-demo.orangehrmlive.com
2. Login with username "Admin" and password "admin123"
3. Navigate to "PIM" module from left sidebar
4. Verify that "Employee Information" section is visible
5. Enter a name in search field
6. Click on "Search"
7. Verify that search results are displayed

---

## Prompt 4: Verify Admin Module Access

Generate a Playwright test for the following scenario:

1. Login to https://opensource-demo.orangehrmlive.com/web/index.php/auth/login with username "Admin" and password "admin123"
2. Click on the "Admin" tab in the left navigation
3. Verify the page contains "System Users"
4. Verify that the "Add" button is visible

## Prompt 5: DDT For Login

Generate a Playwright test in TypeScript using `@playwright/test` that performs data-driven testing with CSV files. Try to use the `csv-parse` package to handle CSV parsing.

Scenario: Login validation on [https://opensource-demo.orangehrmlive.com](https://opensource-demo.orangehrmlive.com?utm_source=chatgpt.com)

## Requirements:

1\. Read test data from an external CSV file called `"loginData.csv"` located in the `"test_data"` folder. The file has the following columns: Username, Password, Expected. Example rows:

- Admin, admin123, Dashboard
- fakeuser, fakepass, Invalid credentials
- ESSUser1, ess123, Invalid credentials

2\. For each row in the dataset:

- Navigate to the OrangeHRM login page
- Enter the Username and Password from the dataset
- Click the Login button
- Verify the Expected result:
  - If Expected = "Dashboard", check that the dashboard page is visible.
  - If Expected = "Invalid credentials", check that the error message "Invalid credentials" is displayed.

3\. Implement iteration so that all rows in the dataset are tested automatically within one test suite.

4\. Log pass/fail results for each dataset entry in the test output.

5\. Close the browser after all tests are complete.