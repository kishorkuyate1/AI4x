# Job Tracker AI — RICEPOT Framework Prompt

## R — ROLE

You are a senior full-stack React developer and UI/UX engineer responsible for designing and implementing a production-quality, local-first Job Tracking Application.

You must build the application as a clean, maintainable, responsive single-page React application that allows users to manage, organize, search, and track job applications through a Kanban workflow.

The application must run completely on the user's local machine and must not require a backend, authentication system, or external database.

---

## I — INSTRUCTIONS

Build a local-first Job Tracker application using the following requirements:

### Application Architecture

* Create a single-page React application.
* Use Vite as the build tool.
* Use React 18+.
* Use functional React components and hooks.
* Store all application data in the browser using IndexedDB.
* Use the `idb` npm package as the IndexedDB wrapper.
* Do not create a backend.
* Do not implement authentication.
* Do not use an external database.
* Do not make external API calls in the initial version.
* Keep the code modular, reusable, readable, and maintainable.

### Job Management

Each job must be represented as a job card containing:

* Company name — required text field
* Job title / role — required text field
* LinkedIn job URL — URL field and clickable link
* Resume used — selectable text/dropdown containing previously used resume names
* Date applied — automatically populated when the job is created and editable afterward
* Salary range — optional text field
* Notes — optional textarea
* Status — determines the Kanban column

### Job Workflow

Implement the following Kanban statuses:

1. Wishlist
2. Applied
3. Follow-up
4. Interview
5. Offer
6. Rejected

Users must be able to move jobs between these statuses using drag-and-drop.

### CRUD Operations

Implement complete CRUD functionality:

* Create a job
* Read/display jobs
* Edit a job
* Delete a job
* Confirm before deletion
* Persist every change immediately to IndexedDB

### Search and Filtering

Provide a search/filter bar that allows users to search jobs by:

* Company name
* Job title / role

The search should update the displayed cards without requiring a page refresh.

### Kanban Board

Create six independent Kanban columns.

Each column must:

* Display its status name
* Display the number of jobs in that column
* Display only jobs belonging to that status
* Allow independent scrolling
* Support drag-and-drop
* Persist status changes immediately to IndexedDB

### Job Card

Each job card should display at minimum:

* Company name
* Job title / role
* Resume used
* Days since applied
* LinkedIn icon/link

The LinkedIn link must be clickable and should open the job URL appropriately.

### Job Form

Provide a modal or slide-over form for creating and editing jobs.

The form must:

* Validate required fields
* Prevent saving when required information is missing
* Provide clear validation messages
* Automatically populate the creation/application date when appropriate
* Allow users to edit existing job information

### Optional Features

If implementation is straightforward and does not negatively affect the core application, implement:

* Light/dark mode
* Export all job data as JSON
* Import JSON data to restore jobs
* Sort jobs within a column by newest/oldest application date

Do not allow optional features to compromise the core CRUD, Kanban, or persistence functionality.

---

## C — CONTEXT

The application is a personal Job Tracking Application intended to help a user manage the complete lifecycle of job applications.

The primary workflow is:

User adds a job
→ Job appears in Wishlist
→ User applies
→ Move job to Applied
→ Follow up with recruiter
→ Move to Follow-up
→ Interview process
→ Move to Interview
→ Offer received
→ Move to Offer

If the application is unsuccessful:

→ Move to Rejected

The application is local-first, meaning all job information belongs to the user and should remain stored locally in the browser.

### Initial Scope

The initial version must NOT fetch jobs automatically from LinkedIn, Naukri, or other external job websites.

The application should instead allow jobs to be manually entered by the user.

External job-source/API integration may be introduced later as a separate feature without breaking the existing local Job Tracker architecture.

### Data Persistence

IndexedDB must be treated as the application's persistent storage layer.

The application should continue to display previously saved jobs after:

* Browser refresh
* Application restart
* Closing and reopening the browser

Do not use temporary React state as the only source of truth.

---

## E — EXAMPLES

### Example 1 — Creating a Job

User enters:

```text
Company: ABC Technologies
Job Title: Senior QA Engineer
LinkedIn URL: https://www.linkedin.com/jobs/view/example
Resume: QA_Lead_Resume
Date Applied: Automatically populated
Salary: ₹20-25 LPA
Notes: Referred by Rahul
Status: Wishlist
```

Expected behavior:

* Validate required fields.
* Create the job.
* Save it to IndexedDB.
* Display the job in the Wishlist column.
* Update the Wishlist count.
* Make the LinkedIn URL clickable.

### Example 2 — Applying for a Job

A job currently exists in:

```text
Wishlist
```

The user applies and drags the card to:

```text
Applied
```

Expected behavior:

* Update the job status to `Applied`.
* Persist the status change immediately to IndexedDB.
* Update both column counts.
* Keep the job after browser refresh.

### Example 3 — Searching

User searches:

```text
QA
```

Expected behavior:

Display jobs where the company name or job title contains `QA`.

Non-matching jobs should be hidden from the current search results.

### Example 4 — Editing

User opens an existing job and changes:

```text
Salary:
₹20-25 LPA
```

to:

```text
₹25-30 LPA
```

Expected behavior:

* Save the updated value.
* Update the UI.
* Persist the change to IndexedDB.

### Example 5 — Deleting

User selects Delete.

Expected behavior:

```text
Are you sure you want to delete this job?
```

If confirmed:

* Delete the job from IndexedDB.
* Remove it from the UI.
* Update the column count.

If cancelled:

* Keep the job unchanged.

---

## P — PROCESS

Follow this implementation process in order.

### Phase 1 — Project Setup

1. Create the Vite React project.
2. Configure React 18+.
3. Configure Tailwind CSS.
4. Install and configure `idb`.
5. Install the selected drag-and-drop library.
6. Create the initial application structure.
7. Confirm that the application starts successfully.

### Phase 2 — Data Layer

1. Design the Job data model.
2. Create the IndexedDB database.
3. Create the jobs object store/table.
4. Create reusable database functions.
5. Implement:

   * Add job
   * Get jobs
   * Update job
   * Delete job
6. Test persistence independently before building the UI.

### Phase 3 — Application Components

Create reusable components such as:

```text
App
├── Header
├── SearchBar
├── KanbanBoard
│   ├── KanbanColumn
│   │   └── JobCard
│   ├── KanbanColumn
│   ├── KanbanColumn
│   ├── KanbanColumn
│   ├── KanbanColumn
│   └── KanbanColumn
├── JobFormModal
├── DeleteConfirmation
└── ImportExport
```

Adjust the structure when technically necessary, but maintain clear separation of responsibilities.

### Phase 4 — CRUD

Implement and test:

```text
Create → Read → Update → Delete
```

Ensure every operation persists to IndexedDB.

### Phase 5 — Kanban

1. Create six status columns.
2. Display jobs according to status.
3. Add drag-and-drop.
4. Update status when a card is moved.
5. Persist the new status.
6. Update column counts.

### Phase 6 — Search and Sorting

Implement:

* Company search
* Role search
* Date sorting

Ensure filtering does not modify or delete the underlying data.

### Phase 7 — UI/UX

Implement:

* Clean professional layout
* Responsive design
* Independent column scrolling
* Status-specific visual accents
* Modal/slide-over job form
* Clear validation messages
* Empty-state messages
* Loading states where required
* Error handling

The visual style should be minimal and professional, inspired by modern productivity applications such as Linear/Trello without copying their proprietary design.

### Phase 8 — Optional Features

Only after the core application is stable:

1. Light/dark mode
2. JSON export
3. JSON import
4. Date sorting improvements

### Phase 9 — Testing

Test at minimum:

* Create valid job
* Attempt to create job without company name
* Attempt to create job without job title
* Edit job
* Delete job
* Cancel deletion
* Drag job between columns
* Refresh browser after creating a job
* Close/reopen application
* Search by company
* Search by role
* Clear search
* Export data
* Import data
* Invalid import file
* Duplicate/invalid data handling
* Responsive layout

### Phase 10 — Final Verification

Before considering the application complete:

* Verify there are no console errors.
* Verify all CRUD operations work.
* Verify IndexedDB persistence.
* Verify drag-and-drop persistence.
* Verify search/filter functionality.
* Verify form validation.
* Verify responsive behavior.
* Verify optional features if implemented.
* Verify that no backend or external API is required.

---

## O — OUTPUT

The final application must provide the following user experience:

### Main Dashboard

```text
┌─────────────────────────────────────────────────────────────┐
│ Job Tracker                         + Add Job   🔍 Search   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Wishlist │ Applied │ Follow-up │ Interview │ Offer │Rejected│
│    5     │    3    │     2     │     1     │   1   │   4   │
│                                                             │
│ ┌───────┐ ┌───────┐ ┌─────────┐ ┌─────────┐ ┌──────┐       │
│ │ Job   │ │ Job   │ │   Job   │ │   Job   │ │ Job  │       │
│ │ Card  │ │ Card  │ │  Card   │ │  Card   │ │Card  │       │
│ └───────┘ └───────┘ └─────────┘ └─────────┘ └──────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Job Card Output

Each card should clearly display:

```text
Company Name
Job Title
Resume Used
X days since applied
🔗 LinkedIn

Edit | Delete
```

### Data Output

Jobs must be stored persistently in IndexedDB and remain available after browser refresh/restart.

### Code Output

Produce:

* Complete working source code
* Proper component structure
* Reusable services
* IndexedDB data layer
* Clear naming conventions
* Error handling
* Validation
* Responsive UI
* Installation instructions
* Run instructions
* Brief explanation of important architectural decisions

Do not generate unnecessary files or duplicate functionality.

---

## T — TESTING, CONSTRAINTS & RULES

### Technical Constraints

* React 18+
* Vite
* Tailwind CSS
* IndexedDB
* `idb`
* Functional components
* React hooks
* Drag-and-drop library such as `@dnd-kit/core`
* Responsive UI
* Browser-local persistence

### Data Rules

* Company name is required.
* Job title is required.
* LinkedIn URL should be validated when provided.
* Date applied must have a valid date.
* Do not silently discard user data.
* Persist changes immediately.
* Do not use mock data as permanent application data.

### Architecture Rules

* No backend.
* No authentication.
* No external database.
* No external API calls in the initial version.
* Keep database operations separate from UI components.
* Avoid placing all application logic inside `App.jsx`.
* Use reusable components and services.
* Do not duplicate database logic across components.

### Reliability Rules

If IndexedDB fails:

* Handle the error gracefully.
* Display a useful message to the user.
* Do not silently pretend that the data was saved.

If importing JSON:

* Validate the imported structure.
* Reject malformed data.
* Do not overwrite existing data without appropriate user confirmation.

### Development Rules

Do not implement the entire application blindly in one step.

Build and verify the application incrementally:

```text
Setup
→ Data Layer
→ CRUD
→ UI
→ Kanban
→ Search
→ Persistence
→ Optional Features
→ Testing
```

After each major phase, verify that the existing functionality still works before proceeding.

Do not remove or rewrite working functionality unless there is a clear technical reason.

If an existing project structure or implementation is provided, understand it first and modify the existing implementation rather than unnecessarily creating a new project.

### Future Extensibility

The architecture should allow future integration of external job sources such as authorized job APIs or other legitimate job-data providers.

Future integrations should feed jobs into the same normalized Job model rather than requiring the UI or database architecture to be redesigned.

The current local-first functionality must continue to work even when external job-source integrations are added later.
