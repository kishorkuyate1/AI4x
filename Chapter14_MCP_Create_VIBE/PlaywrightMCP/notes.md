# Playwright MCP notes

Simple notes so I can remember how this folder was set up and how the OrangeHRM tests were written.

## What we were doing

We wanted Playwright tests for the OrangeHRM demo site, but we did not want to guess the buttons and fields.

The rule was: open the real website first, look at the real page, then write the test from what we actually saw.

Two tools worked together:

- **Playwright** runs the test later, by itself.
- **Playwright MCP** lets the AI open the site in a browser while we are writing the test.

## 1. How Playwright was already in this folder

This folder already had a Playwright project:

- [package.json](package.json) has `@playwright/test`
- [playwright.config.ts](playwright.config.ts) says tests live in the `tests` folder
- Chromium, Firefox, and WebKit are listed in the config

We used Chromium for the runs in this session.

## 2. How we installed Playwright MCP

MCP means the AI can use extra tools. Playwright MCP is the browser tool.

The project config is in [.mcp.json](../../.mcp.json) at the repo root:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

What that means in plain words:

- VS Code starts the MCP with `npx`
- `npx` downloads and runs `@playwright/mcp@latest`
- The AI can then open pages, click, and type

We checked that it starts with:

```powershell
npx -y @playwright/mcp@latest --help
```

Playwright MCP needs a browser. We installed Chromium with:

```powershell
npx -y playwright@latest install chromium
```

If VS Code does not see the MCP, reload the window.

## 3. First practice: TodoMVC

Before OrangeHRM, we tried a small site:

1. Open https://demo.playwright.dev/todomvc
2. Type `Learn MCP` in "What needs to be done?"
3. Press Enter
4. Check that `Learn MCP` is in the list and the page says `1 item left`

This was only a practice check. We did not save a test file for it.

## 4. How a test script was generated

We did not write selectors from memory. Each OrangeHRM test followed the same steps.

1. Read the scenario from [tests/Playwright-MCP-Test-Prompts-OrangeHRM.md](tests/Playwright-MCP-Test-Prompts-OrangeHRM.md).
2. Open the site with Playwright MCP.
3. Do the steps on the real page: login, click, type, save.
4. Write down only locators we saw, mostly `getByRole()`.
5. Save a TypeScript test in `tests`.
6. Run it and fix it if it fails.

Good locator example:

```typescript
page.getByRole('button', { name: 'Login' })
page.getByRole('textbox', { name: 'Username' })
```

We avoided XPath, `nth-child`, and long CSS chains.

Context files that told us to work this way:

- [Playwright-Context.md](Playwright-Context.md) — look first, then write the test
- [Playwright-ContextPOM.md](Playwright-ContextPOM.md) — same rule, but put page actions in page classes

## 5. Tests we saved

| What we checked | Test file | Result |
| --- | --- | --- |
| Login shows the dashboard | [tests/orangehrm-login.spec.ts](tests/orangehrm-login.spec.ts) | Passed on Chromium |
| Logout returns to the login page | [tests/orangehrm-logout.spec.ts](tests/orangehrm-logout.spec.ts) | Passed on Chromium |
| Add employee and see the name on the profile | [tests/orangehrm-add-employee.spec.ts](tests/orangehrm-add-employee.spec.ts) | Passed on Chromium |

Login details used on the demo site:

- Username: `Admin`
- Password: `admin123`

### Login

After login, the URL contains `/dashboard/index` and the page has a heading named `Dashboard`.

### Logout

The profile icon is an image named `profile picture`. The name beside it was `John Doe`, but that name is demo data, so we did not use it.

Clicking the image opens a menu. Logout is a menu item named `Logout`. After that, the URL contains `/auth/login` and the Username box is visible.

### Add employee

This test uses page classes in [pages/](pages):

- `LoginPage` opens the site and logs in
- `DashboardPage` clicks PIM
- `AddEmployeePage` opens Add Employee and saves the form
- `EmployeeProfilePage` finds the name heading

Flow we saw:

1. Site root opens the login page.
2. PIM is a left-side link. It opens the employee list.
3. Add Employee is a top link, not a button. It opens `/pim/addEmployee`.
4. First Name and Last Name are textboxes.
5. Save opens `/pim/viewPersonalDetails/empNumber/{id}`.
6. The full name `John123 Doe456` is a heading.

One important catch: the form already fills an Employee Id, and that id can already exist. Save then shows `Employee Id already exists`. The Employee Id label is not linked to the input, so `getByLabel` does not work. The page class replaces that id with a short unique value before Save.

## 6. How to run a test later

From this folder:

```powershell
npx playwright test tests/orangehrm-login.spec.ts --project=chromium --reporter=line
npx playwright test tests/orangehrm-logout.spec.ts --project=chromium --reporter=line
npx playwright test tests/orangehrm-add-employee.spec.ts --project=chromium --reporter=line
```

`--project=chromium` runs only Chrome. The config also lists Firefox and Safari, but we did not use those for these checks.

## 7. Short memory list

- MCP is for looking at the live site while writing the test.
- Playwright is for running the saved test later.
- Do not invent a selector. If I did not see it, I do not use it.
- Prefer `getByRole()`.
- Let Playwright wait. Do not add `waitForTimeout`.
- Keep checks in the test file. Keep clicks and typing in page classes when using POM.
- The OrangeHRM demo is shared. Employee Id must be unique or Save will fail.
