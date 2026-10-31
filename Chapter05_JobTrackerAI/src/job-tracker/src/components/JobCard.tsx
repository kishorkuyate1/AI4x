import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, GripVertical, Pencil, Trash2, UserRound } from 'lucide-react'
import { JOB_STATUSES, type Job, type JobStatus } from '../types/job'
import { formatDays } from '../utils/dateUtils'

interface JobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  onStatusChange: (job: Job, status: JobStatus) => void
}

export function JobCard({ job, onEdit, onDelete, onStatusChange }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const resumeLabel = job.resumeName || (job.resumeId ? 'Resume removed' : null)
  const ageLabel = job.status === 'Wishlist' ? formatDays(job.dateAdded) : formatDays(job.dateApplied, 'No apply date')

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Drag job"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50" title={job.companyName}>
            {job.companyName}
          </h3>
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="mt-0.5 block w-full truncate text-left text-sm text-zinc-600 hover:underline dark:text-zinc-300"
            title={job.jobTitle}
          >
            {job.jobTitle}
          </button>
        </div>
        {job.jobUrl ? (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Open job posting"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {resumeLabel ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {resumeLabel}
          </span>
        ) : null}
        {job.location ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {job.location}
          </span>
        ) : null}
        {job.salaryRange ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {job.salaryRange}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>{job.status === 'Wishlist' ? `Added ${ageLabel}` : `Applied ${ageLabel}`}</span>
        {job.recruiterName || job.status === 'Follow-up' ? (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <UserRound className="h-3 w-3" />
            {job.recruiterName || 'Follow up'}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          value={job.status}
          onChange={(event) => onStatusChange(job, event.target.value as JobStatus)}
          aria-label="Move job to another stage"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {JOB_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => onEdit(job)}
          aria-label="Edit job"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
          onClick={() => onDelete(job)}
          aria-label="Delete job"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  )
}
