# Plan — Local-First Job Tracker (prompt.md)

Build the app specified in [`prompt.md`](./prompt.md) as a complete Vite + React + TypeScript SPA. Do not reuse `Chapter04_JobkitAI/src/job-tracker` as the product; inspect it only to avoid repeating mistakes. Leave `FetchJob/`, `resaurses/`, and `prompt.md` untouched.

## 1. Key decisions

| Decision | Choice | Why |
|---|---|---|
| App location | `Chapter05_JobTrackerAI/src/job-tracker/` | Matches the prompt’s `job-tracker/` layout; `src/` is currently empty |
| Backend / auth / APIs | None | Prompt forbids them; no `.env` |
| Persistence | IndexedDB via `idb` (source of truth); React state is a cache only | Prompt §10 |
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | Prompt §2 / §4 |
| Styling | Tailwind CSS (install current major; configure per official docs) | Prompt §2 |
| Icons | `lucide-react` | Prompt §2 |
| Dates | Native `Date` + small `dateUtils.ts` | Avoid extra deps |
| IDs | `crypto.randomUUID()` | Unique, no server |
| Theme | `class` on `<html>` + `prefers-color-scheme` first visit; persist in preferences store | Prompt §13 |
| Credentials | **Do not ask, do not create `.env`** | Nothing to authenticate |

## 2. Scaffold (immediate commands)

From `Chapter05_JobTrackerAI/src`:

```bash
npm create vite@latest job-tracker -- --template react-ts
cd job-tracker
npm install
npm install idb @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
```

Then install/configure Tailwind for the version npm resolved (v4 PostCSS plugin vs v3 `tailwind.config`). Add `idb` types if needed. Confirm `npm run dev` serves `http://localhost:5173`.

## 3. Target structure

```text
Chapter05_JobTrackerAI/src/job-tracker/
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
│   │   ├── ResumeManager.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── Toast.tsx
│   ├── context/
│   │   └── AppContext.tsx
│   ├── db/
│   │   └── database.ts
│   ├── hooks/
│   │   ├── useJobs.ts
│   │   ├── useResumes.ts
│   │   └── useTheme.ts
│   ├── types/
│   │   ├── job.ts
│   │   ├── resume.ts
│   │   └── backup.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── validation.ts
│   │   └── backupUtils.ts
│   ├── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 4. Data model (implement first)

**JobStatus:** `Wishlist | Applied | Follow-up | Interview | Offer | Rejected` (fixed column order).

**Job:** `id`, `companyName`, `jobTitle`, `jobUrl?`, `resumeId?`, `dateAdded`, `dateApplied?`, `salaryRange?`, `location?`, `employmentType?` (`Full-time | Part-time | Contract | Internship | Freelance`), `recruiterName?`, `recruiterEmail?`, `referralDetails?`, `notes?`, `status`, `sortOrder`, `createdAt`, `updatedAt`.

**Resume:** `id`, `name`, `createdAt`, `updatedAt`.

**Preferences:** `theme: 'light' | 'dark' | 'system'`, plus filter/sort defaults if useful.

**Backup JSON:** `{ schemaVersion, exportedAt, jobs, resumes, preferences }`. Filename: `job-tracker-backup-YYYY-MM-DD.json`.

Validation before save: required company + title; URL/email only if filled; never invent fields.

## 5. IndexedDB

DB name `JobTrackerDB`, version `1`.

Stores:

- `jobs` — key `id`, indexes: `status`, `dateAdded`, `dateApplied`, `companyName`, `resumeId`
- `resumes` — key `id`, index `name`
- `preferences` — key `key`

CRUD in `database.ts` only. Optimistic UI is allowed; rollback + toast on failure. Never use localStorage as the job DB (theme may live in preferences store; a one-time system-theme read is fine).

**Date Applied rule:** empty in Wishlist; set to today the first time status becomes Applied if missing; never overwrite an existing date.

## 6. UI / behavior (build order)

1. **Types + DB + hooks** — load on boot, loading/empty/error states.
2. **Header + stats** — total, Wishlist, Applied, Interview, Offer, Rejected; recompute on every mutation; jobs counted once.
3. **Kanban** — 6 independently scrolling columns, counts, status accent colors. Cards: company, title, resume tag, location, salary, days since applied (or days since added for Wishlist), external job link (`rel="noopener noreferrer"`), recruiter/follow-up cue, edit/delete.
4. **Job form** — modal/slide-over; create defaults to Wishlist; inline validation; Save/Cancel; no double-submit.
5. **Delete** — in-app confirm with company + title; toast result. No `window.alert` for routine UX.
6. **Search/filter/sort** — search company, title, recruiter, URL; filters: status, resume, employment type, location, applied date range; Clear Filters; sort per column (added/applied newest/oldest, company A–Z). Filters never mutate DB.
7. **DnD** — `@dnd-kit` between columns; persist status + `sortOrder` on drop; no duplicate records; dropdown move as accessible fallback; drop-target highlight.
8. **Resumes** — add / rename / delete-with-confirm; jobs keep stale name or “Resume removed” if label deleted.
9. **Import/export** — validate schema; preview counts; merge (dedupe by `id`) vs replace (confirm); transactional-ish: fail closed, no partial wipe.
10. **Theme + a11y** — light/dark persist; keyboard focus; responsive: desktop multi-column, tablet/mobile horizontal scroll or single column.

## 7. Edge cases to handle explicitly

Empty board, empty search, invalid URL/email, missing optionals, no `dateApplied`, rapid DnD, IDB failures, bad JSON, import dupes, deleted resume still referenced, long titles (truncate + title attr), refresh mid-edit, accidental delete.

User-facing messages only; console debug in dev, no secrets.

## 8. Verification (must pass before done)

- `npm run dev` on localhost
- `npm run build` clean
- Create / edit / delete job
- Move through all 6 columns; data survives refresh
- Stats and column counts correct
- Search, filters, sort
- Resume CRUD
- Job URL opens new tab
- JSON export/import merge + replace
- Theme persists
- No major console errors

README: install, `npm run dev`, feature list, verification notes, limitations (browser-local only, no file uploads).

## 9. What I will not do

- No `.env`, Jira, LinkedIn fetch, or paid APIs
- No auth, backend, or `localStorage` as primary DB
- No rewriting Chapter 4 in place
- No stopping after scaffolding

## 10. Immediate next step after this plan is saved

Scaffold `src/job-tracker`, then types → IndexedDB → shell UI → CRUD → Kanban/DnD → filters → resumes → backup → theme/a11y → verify.
