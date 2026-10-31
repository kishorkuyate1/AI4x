# Prompt to Build a Local-First Job Tracker Application (localhost)

## 1. Role and Objective

Act as a senior full-stack developer and UI/UX designer. Build a complete, responsive, local-first **Job Tracker application** using React, Vite, TypeScript, Tailwind CSS, and IndexedDB.

The application will help users organize job opportunities, track application progress, manage resumes, record recruiter details, and monitor interview stages through a Kanban board.

The application must run locally on `localhost` without requiring a backend, external database, authentication, or paid services.

**Primary objective:** Create a fully functional application, not just a UI mockup or static prototype.

## 2. Technology Stack

Use the following technologies:

- Frontend: React 18+ with TypeScript
- Build tool: Vite
- Styling: Tailwind CSS
- Local database: IndexedDB using the `idb` library
- Drag-and-drop: `@dnd-kit/core` and related compatible packages
- Icons: Lucide React
- State management: React hooks and context where appropriate
- Date handling: Native JavaScript date utilities or a lightweight date library

Use functional components, reusable UI components, clean code, and a maintainable project structure.

Do not introduce a backend, server-side database, external API, or authentication system.

## 3. Job Data Model

Each job record must contain the following fields:

- **ID:** Unique identifier generated automatically.
- **Company Name:** Required text field.
- **Job Title:** Required text field.
- **Job URL:** Optional valid URL, preferably the original LinkedIn job posting.
- **Resume Used:** Dropdown populated with saved resume names, with an option to add a new resume name.
- **Date Added:** Automatically generated when the job is created.
- **Date Applied:** Automatically set when the job moves to Applied for the first time; editable by the user. Keep it empty while the job is in Wishlist.
- **Salary Range:** Optional text field, supporting values such as ₹25–30 LPA or $150K–180K.
- **Location:** Optional text field for city, state, country, or remote work.
- **Employment Type:** Optional dropdown: Full-time, Part-time, Contract, Internship, or Freelance.
- **Recruiter Name:** Optional text field.
- **Recruiter Email:** Optional valid email address.
- **Referral Details:** Optional text field.
- **Notes:** Optional multiline text field.
- **Status:** Current Kanban stage.
- **Created At:** Automatically generated timestamp.
- **Updated At:** Automatically updated whenever the record changes.

Use a consistent TypeScript interface for the job record and validate data before saving.

## 4. Kanban Board

Create a Kanban board with the following six columns in the specified order:

1. **Wishlist** — Jobs saved for future applications.
2. **Applied** — Applications that have been submitted.
3. **Follow-up** — Applications requiring recruiter follow-up.
4. **Interview** — Applications currently in interview rounds.
5. **Offer** — Jobs for which an offer has been received.
6. **Rejected** — Applications that have been rejected.

### Kanban requirements

- Display each job as a card in its current status column.
- Support drag-and-drop movement between columns using `@dnd-kit`.
- Update the job status and persist the change to IndexedDB immediately after a successful drop.
- Show the number of jobs in each column.
- Make each column independently scrollable.
- Preserve card ordering where practical.
- Provide a clear visual indication of the column receiving a dragged card.
- Support moving jobs through an accessible alternative, such as a status dropdown.
- Ensure drag-and-drop works on supported desktop and tablet layouts.

Changing a job's status must never create a duplicate job record.

## 5. Job Card Design

Each job card should display:

- Company name
- Job title
- Resume name as a small tag
- Job location, if available
- Salary range, if available
- Days since application, when an application date exists
- Clickable job link with an external-link icon
- Recruiter or follow-up indicator, when applicable
- Edit and delete actions

### Card behavior

- Clicking the job title or Edit action opens the job details form.
- Clicking the job link opens the original posting in a new browser tab.
- External links must use appropriate security attributes.
- Show the most relevant information without overcrowding the card.
- Use subtle status-specific accent colors and consistent spacing.

For Wishlist jobs, display the number of days since the job was added rather than showing an application age.

## 6. Add and Edit Job Form

Implement a modal or slide-over form for creating and editing job records.

### Form requirements

- Clearly label every field.
- Mark required fields.
- Validate company name and job title.
- Validate URL and email formats when those fields are populated.
- Display helpful inline validation messages.
- Preserve existing values when editing a job.
- Prevent accidental duplicate submissions.
- Provide Save and Cancel actions.
- Close the form after a successful save.
- Display a clear error message if saving fails.

When creating a job, default its status to Wishlist unless the user explicitly selects another status.

When a job first moves to Applied, automatically populate Date Applied with the current date if no date exists. Do not overwrite an existing application date when moving between other stages.

## 7. Search, Filtering, and Sorting

Create a search and filtering toolbar above the Kanban board.

### Search

Allow users to search by:

- Company name
- Job title
- Recruiter name
- Job URL

Search results should update immediately as the user types.

### Filters

Provide optional filters for:

- Application status
- Resume used
- Employment type
- Location
- Application date range

Include a Clear Filters action.

Filtering must affect only the displayed results and must not modify or delete stored records.

### Sorting

Allow users to sort jobs within each column by:

- Date added: Newest first
- Date added: Oldest first
- Date applied: Newest first
- Date applied: Oldest first
- Company name: A–Z

Handle jobs without an application date gracefully.

## 8. Resume Management

Create a simple resume-name management feature.

Users should be able to:

- Add a resume name, such as `QA_Lead_Resume_v1`.
- Select an existing resume from a dropdown.
- Rename a resume label.
- Delete a resume label after confirming the action.

Store resume names locally in IndexedDB.

The application manages resume names and references only; it does not need to upload or store actual resume files.

If a resume label is deleted, preserve historical job records and handle the affected references gracefully.

## 9. Dashboard and Summary Statistics

Create a compact dashboard above the Kanban board with summary cards displaying:

- Total jobs tracked
- Jobs in Wishlist
- Applications submitted
- Interviews in progress
- Offers received
- Rejections

Calculate these values from the locally stored job records.

Statistics must update immediately when a job is added, edited, deleted, or moved to another stage.

Do not count a job more than once in the total.

## 10. IndexedDB Persistence

Use the `idb` library to create and manage an IndexedDB database.

Create appropriate object stores for:

- Jobs
- Resume names
- Application preferences, if required

### Persistence requirements

- Save new records to IndexedDB.
- Update existing records without duplication.
- Delete records after confirmation.
- Persist drag-and-drop status changes.
- Load saved records when the application starts.
- Reflect successful changes immediately in the UI.
- Handle database errors gracefully.
- Show a loading state while the initial data is being retrieved.
- Show a helpful empty state when no jobs exist.
- Preserve all data after refreshing, closing, or reopening the browser.

Do not use React state or localStorage as the primary database. React state may be used as a UI cache, but IndexedDB must remain the source of truth.

Ensure asynchronous database operations are handled correctly and avoid overwriting newer data with stale state.

## 11. Import and Export

Implement local backup and restore functionality.

### Export

- Export all jobs, resume names, and relevant preferences as a downloadable JSON file.
- Include a schema version and export timestamp.
- Generate a meaningful filename, such as `job-tracker-backup-2026-10-24.json`.
- Do not export unnecessary sensitive browser or system information.

### Import

- Allow users to select a previously exported JSON file.
- Validate the file structure, schema version, and required fields.
- Show a preview of the number of jobs and resume names before importing.
- Let the user choose whether to merge with existing data or replace it.
- Prevent accidental duplication during merging.
- Ask for confirmation before replacing existing data.
- Perform database updates safely and handle errors without leaving partially imported data.

Never delete existing records without explicit confirmation.

## 12. Delete and Confirmation Behavior

Before deleting a job, show a confirmation dialog containing the company name and job title.

Provide Confirm Delete and Cancel actions.

Only delete the selected job after explicit confirmation.

Display a success or error notification after the operation completes.

Avoid using browser alerts for routine interactions when a consistent in-app dialog or toast notification is available.

## 13. UI/UX Design Requirements

Create a clean, professional dashboard inspired by the simplicity of Linear and Trello.

### Layout

- Application header with logo/title and primary actions.
- Summary dashboard cards.
- Search, filters, and sorting controls.
- Horizontally arranged Kanban columns.
- Independent vertical scrolling within columns.
- Responsive layout for laptops, tablets, and smaller screens.

### Visual design

- Use a neutral background with clear contrast.
- Use consistent typography, spacing, borders, and rounded corners.
- Apply subtle shadows and status-specific accent colors.
- Use Lucide icons for actions and navigation.
- Provide hover, focus, active, loading, empty, and error states.
- Avoid excessive animations and unnecessary visual clutter.
- Ensure keyboard accessibility and visible focus indicators.

### Theme

Implement a Light/Dark Mode toggle.

Persist the selected theme locally so that it remains selected after refreshing the application.

Respect system theme preferences on the first visit unless the user explicitly selects a theme.

### Responsive behavior

- On desktop, display multiple Kanban columns side by side.
- On tablets, allow horizontal scrolling through columns.
- On narrow screens, provide a usable single-column or horizontally scrollable board.
- Ensure forms, dialogs, and controls fit within the viewport.

## 14. Error Handling and Edge Cases

Handle the following scenarios:

- Empty job list.
- Empty search results.
- Invalid URLs or email addresses.
- Missing optional fields.
- Jobs without an application date.
- Repeated drag-and-drop operations.
- Failed IndexedDB reads or writes.
- Invalid or corrupted JSON imports.
- Duplicate records during import.
- Resume labels deleted while jobs still reference them.
- Long company names and job titles.
- Browser refresh during normal usage.
- Accidental clicks on destructive actions.

Use user-friendly messages rather than exposing technical stack traces in the UI.

Log useful debugging information to the browser console during development without exposing unnecessary sensitive data.

## 15. Project Structure

Organize the project into reusable components and utilities.

Suggested structure:

```text
job-tracker/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobForm.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Toast.tsx
│   ├── db/
│   │   └── database.ts
│   ├── hooks/
│   │   └── useJobs.ts
│   ├── types/
│   │   └── job.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── backupUtils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

You may adjust the structure if necessary, but keep database logic, UI components, types, and utility functions separated.

## 16. Implementation Workflow

Follow this implementation sequence:

1. Inspect the existing project folder before creating or modifying files.
2. Set up Vite with React and TypeScript if the project does not already exist.
3. Install compatible dependencies.
4. Configure Tailwind CSS according to the installed version and its official setup requirements.
5. Define TypeScript interfaces and the IndexedDB schema.
6. Implement database initialization and CRUD operations.
7. Build the dashboard and Kanban board.
8. Implement job creation, editing, deletion, search, filtering, and sorting.
9. Add resume management and backup/restore functionality.
10. Implement drag-and-drop and status persistence.
11. Add responsive styling, accessibility, and theme support.
12. Run the application and test the main user workflows.
13. Fix build errors, TypeScript errors, runtime exceptions, and broken interactions.
14. Verify that data survives a page refresh.
15. Provide the final setup and execution instructions.

Do not stop after generating the initial files. Complete the implementation and validate the main functionality.

## 17. Acceptance Criteria

The application is considered complete when all the following are satisfied:

- [ ] The project starts successfully on localhost.
- [ ] A user can create a job with valid required fields.
- [ ] A user can edit and delete existing jobs.
- [ ] Jobs can be moved between all six Kanban stages.
- [ ] Status changes are saved to IndexedDB.
- [ ] Job data survives browser refresh and reopening.
- [ ] Column counts and dashboard statistics remain accurate.
- [ ] Search, filtering, and sorting work correctly.
- [ ] Resume names can be managed locally.
- [ ] Job URLs open correctly.
- [ ] JSON export and import work safely.
- [ ] Light and dark themes work and persist.
- [ ] The layout is responsive and usable on laptops and tablets.
- [ ] Validation and error states are handled properly.
- [ ] No backend, authentication, or external API is required.
- [ ] No major console errors or broken interactions remain.

## 18. Final Deliverables

Provide:

1. Complete, working application source code.
2. All required configuration and dependency files.
3. A clear README with setup and usage instructions.
4. The exact commands to install dependencies and start the application.
5. A summary of implemented features.
6. A brief verification report listing the major workflows tested and any known limitations.

### Execution Commands

For a new project, use the appropriate equivalent of:

```bash
npm create vite@latest job-tracker -- --template react-ts
cd job-tracker
npm install
npm install idb @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
npm run dev
```

Install and configure Tailwind CSS using the instructions compatible with the selected Tailwind version.

The development server should display a local URL, typically `http://localhost:5173`.

**Final instruction:** Build a polished, reliable, fully functional local-first Job Tracker. Prioritize data integrity, correct behavior, responsive design, and maintainable code over unnecessary features. Verify the application before declaring it complete.