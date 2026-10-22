export const JOB_STATUSES = [
  { id: 'Wishlist', label: 'Wishlist', color: 'bg-blue-100 text-blue-800', darkColor: 'dark:bg-blue-900 dark:text-blue-200' },
  { id: 'Applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-800', darkColor: 'dark:bg-yellow-900 dark:text-yellow-200' },
  { id: 'Follow-up', label: 'Follow-up', color: 'bg-indigo-100 text-indigo-800', darkColor: 'dark:bg-indigo-900 dark:text-indigo-200' },
  { id: 'Interview', label: 'Interview', color: 'bg-green-100 text-green-800', darkColor: 'dark:bg-green-900 dark:text-green-200' },
  { id: 'Offer', label: 'Offer', color: 'bg-emerald-100 text-emerald-800', darkColor: 'dark:bg-emerald-900 dark:text-emerald-200' },
  { id: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', darkColor: 'dark:bg-red-900 dark:text-red-200' },
];

export const STATUS_COLORS = {
  'Wishlist': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-800', dark: 'dark:bg-blue-900 dark:text-blue-200' },
  'Applied': { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-800', dark: 'dark:bg-yellow-900 dark:text-yellow-200' },
  'Follow-up': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-800', dark: 'dark:bg-indigo-900 dark:text-indigo-200' },
  'Interview': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-800', dark: 'dark:bg-green-900 dark:text-green-200' },
  'Offer': { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-800', dark: 'dark:bg-emerald-900 dark:text-emerald-200' },
  'Rejected': { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-800', dark: 'dark:bg-red-900 dark:text-red-200' },
};

export const DB_NAME = 'JobTrackerDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'jobs';

export const RESUME_OPTIONS = [
  'Default Resume',
  'QA Resume',
  'Developer Resume',
  'Manager Resume',
  'Lead Resume',
  'Custom Resume',
];

export function getDaysSinceApplied(dateApplied) {
  if (!dateApplied) return 0;
  const applied = new Date(dateApplied);
  const today = new Date();
  const diffTime = Math.abs(today - applied);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
