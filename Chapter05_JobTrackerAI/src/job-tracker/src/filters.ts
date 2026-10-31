import type { SortOption } from './constants'
import { EMPLOYMENT_TYPES, JOB_STATUSES, type EmploymentType, type Job, type JobStatus } from './types/job'
import { datePart } from './utils/dateUtils'
import { includesInsensitive } from './utils/strings'

export interface JobFilters {
  search: string
  status: 'all' | JobStatus
  resumeId: 'all' | string
  employmentType: 'all' | EmploymentType
  location: string
  appliedFrom: string
  appliedTo: string
  sort: SortOption
}

export const defaultFilters: JobFilters = {
  search: '',
  status: 'all',
  resumeId: 'all',
  employmentType: 'all',
  location: '',
  appliedFrom: '',
  appliedTo: '',
  sort: 'board',
}

export function filterAndSortJobs(jobs: Job[], filters: JobFilters): Job[] {
  const search = filters.search.trim().toLowerCase()

  const filtered = jobs.filter((job) => {
    if (search) {
      const haystacks = [job.companyName, job.jobTitle, job.recruiterName, job.jobUrl]
      if (!haystacks.some((value) => includesInsensitive(value, search))) return false
    }
    if (filters.status !== 'all' && job.status !== filters.status) return false
    if (filters.resumeId !== 'all' && job.resumeId !== filters.resumeId) return false
    if (filters.employmentType !== 'all' && job.employmentType !== filters.employmentType) return false
    if (filters.location.trim() && !includesInsensitive(job.location, filters.location.trim())) return false

    const applied = datePart(job.dateApplied)
    if (filters.appliedFrom && (!applied || applied < filters.appliedFrom)) return false
    if (filters.appliedTo && (!applied || applied > filters.appliedTo)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'added-asc':
        return a.dateAdded.localeCompare(b.dateAdded)
      case 'added-desc':
        return b.dateAdded.localeCompare(a.dateAdded)
      case 'applied-desc':
        return (b.dateApplied ?? '').localeCompare(a.dateApplied ?? '')
      case 'applied-asc':
        return (a.dateApplied ?? '9999').localeCompare(b.dateApplied ?? '9999')
      case 'company-asc':
        return a.companyName.localeCompare(b.companyName)
      case 'board':
      default:
        return a.sortOrder - b.sortOrder
    }
  })

  return sorted
}

export function isFilterActive(filters: JobFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.resumeId !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.location.trim() !== '' ||
    filters.appliedFrom !== '' ||
    filters.appliedTo !== ''
  )
}

export { JOB_STATUSES, EMPLOYMENT_TYPES }
