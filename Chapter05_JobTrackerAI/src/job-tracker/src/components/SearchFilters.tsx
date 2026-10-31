import { inputClass, labelClass, SORT_OPTIONS } from '../constants'
import { defaultFilters, type JobFilters } from '../filters'
import { EMPLOYMENT_TYPES, JOB_STATUSES } from '../types/job'
import type { Resume } from '../types/resume'

interface SearchFiltersProps {
  filters: JobFilters
  resumes: Resume[]
  locations: string[]
  onChange: (filters: JobFilters) => void
}

export function SearchFilters({ filters, resumes, locations, onChange }: SearchFiltersProps) {
  const set = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="md:col-span-2">
          <span className={labelClass}>Search</span>
          <input
            className={inputClass}
            value={filters.search}
            onChange={(event) => set('search', event.target.value)}
            placeholder="Company, title, recruiter, or URL"
          />
        </label>
        <label>
          <span className={labelClass}>Status</span>
          <select className={inputClass} value={filters.status} onChange={(event) => set('status', event.target.value as JobFilters['status'])}>
            <option value="all">All statuses</option>
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Resume used</span>
          <select className={inputClass} value={filters.resumeId} onChange={(event) => set('resumeId', event.target.value)}>
            <option value="all">All resumes</option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Employment type</span>
          <select
            className={inputClass}
            value={filters.employmentType}
            onChange={(event) => set('employmentType', event.target.value as JobFilters['employmentType'])}
          >
            <option value="all">All types</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Location</span>
          <input
            className={inputClass}
            list="location-options"
            value={filters.location}
            onChange={(event) => set('location', event.target.value)}
            placeholder="City or remote"
          />
          <datalist id="location-options">
            {locations.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </label>
        <label>
          <span className={labelClass}>Applied from</span>
          <input type="date" className={inputClass} value={filters.appliedFrom} onChange={(event) => set('appliedFrom', event.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Applied to</span>
          <input type="date" className={inputClass} value={filters.appliedTo} onChange={(event) => set('appliedTo', event.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Sort within columns</span>
          <select className={inputClass} value={filters.sort} onChange={(event) => set('sort', event.target.value as JobFilters['sort'])}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onChange(defaultFilters)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Clear filters
        </button>
      </div>
    </section>
  )
}
