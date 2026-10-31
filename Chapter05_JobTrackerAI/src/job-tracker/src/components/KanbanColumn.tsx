import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { STATUS_ACCENT, STATUS_PILL } from '../constants'
import type { Job, JobStatus } from '../types/job'
import { JobCard } from './JobCard'

interface KanbanColumnProps {
  status: JobStatus
  jobs: Job[]
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  onStatusChange: (job: Job, status: JobStatus) => void
}

export function KanbanColumn({ status, jobs, onEdit, onDelete, onStatusChange }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40 ${
        isOver ? 'ring-2 ring-zinc-400' : ''
      }`}
    >
      <header className={`flex items-center justify-between border-t-4 px-3 py-3 ${STATUS_ACCENT[status]}`}>
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{status}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_PILL[status]}`}>{jobs.length}</span>
      </header>
      <div ref={setNodeRef} className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
        <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
          ))}
        </SortableContext>
        {jobs.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-400">Drop jobs here</p>
        ) : null}
      </div>
    </section>
  )
}
