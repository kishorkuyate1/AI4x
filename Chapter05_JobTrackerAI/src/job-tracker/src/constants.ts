import type { JobStatus } from './types/job'

export const DB_NAME = 'JobTrackerDB'
export const DB_VERSION = 1

export const SORT_OPTIONS = [
  { value: 'board', label: 'Board order' },
  { value: 'added-desc', label: 'Date added: Newest first' },
  { value: 'added-asc', label: 'Date added: Oldest first' },
  { value: 'applied-desc', label: 'Date applied: Newest first' },
  { value: 'applied-asc', label: 'Date applied: Oldest first' },
  { value: 'company-asc', label: 'Company name: A–Z' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

export const STATUS_ACCENT: Record<JobStatus, string> = {
  Wishlist: 'border-t-slate-400',
  Applied: 'border-t-blue-500',
  'Follow-up': 'border-t-amber-500',
  Interview: 'border-t-violet-500',
  Offer: 'border-t-emerald-500',
  Rejected: 'border-t-rose-500',
}

export const STATUS_PILL: Record<JobStatus, string> = {
  Wishlist: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  Applied: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  'Follow-up': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  Interview: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
  Offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
}

export const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

export const labelClass = 'mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400'
