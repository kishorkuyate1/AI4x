# Job Tracker

Local-first Kanban app for tracking job applications. Data stays in IndexedDB in this browser. There is no backend, login, or `.env` file.

## Setup

```bash
cd Chapter05_JobTrackerAI/src/job-tracker
npm install
npm run dev
```

Open `http://localhost:5173`.

Production build:

```bash
npm run build
npm run preview
```

## Features

- Six-column board: Wishlist, Applied, Follow-up, Interview, Offer, Rejected
- Create, edit, delete jobs with validation
- Drag-and-drop plus a status dropdown
- Search, filters, and column sorting
- Resume name management (labels only, no file uploads)
- Dashboard counts
- Light/dark theme (follows system until you choose)
- JSON export/import with merge or replace

## Verification

Checked during implementation:

- App starts on localhost
- IndexedDB is the source of truth (refresh keeps data)
- Status moves do not duplicate records
- Date applied is set the first time a job enters Applied
- Import validates schema before writing

## Limitations

- Data is per browser profile, not synced across devices
- Resume files are not stored, only names
- Backup JSON is not encrypted

## Tech

React 19, Vite, TypeScript, Tailwind CSS v4, `idb`, `@dnd-kit`, Lucide.
