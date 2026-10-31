import type { Job, JobStatus } from '../types/job'

export function nowIso(): string {
  return new Date().toISOString()
}

export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function datePart(value: string | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function daysSince(value: string | undefined): number | null {
  const part = datePart(value)
  if (!part) return null
  const [y, m, d] = part.split('-').map(Number)
  if (!y || !m || !d) return null
  const start = Date.UTC(y, m - 1, d)
  const now = new Date()
  const end = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((end - start) / 86_400_000))
}

export function formatDays(value: string | undefined, emptyLabel = '—'): string {
  const days = daysSince(value)
  if (days === null) return emptyLabel
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function applyStatusChange(job: Job, nextStatus: JobStatus): Job {
  const next: Job = {
    ...job,
    status: nextStatus,
    updatedAt: nowIso(),
  }

  if (nextStatus === 'Applied' && !next.dateApplied) {
    next.dateApplied = todayIsoDate()
  }

  return next
}
