import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { JOB_STATUSES, type Job, type JobStatus } from '../types/job'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  jobsByStatus: Record<JobStatus, Job[]>
  emptyBoard: boolean
  emptyFilter: boolean
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  onStatusChange: (job: Job, status: JobStatus) => void
  onMove: (jobId: string, destStatus: JobStatus, destIndex: number) => void
}

export function KanbanBoard({
  jobsByStatus,
  emptyBoard,
  emptyFilter,
  onEdit,
  onDelete,
  onStatusChange,
  onMove,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const allJobs = JOB_STATUSES.flatMap((status) => jobsByStatus[status])
    const activeJob = allJobs.find((job) => job.id === activeId)
    if (!activeJob) return

    const isColumn = (JOB_STATUSES as readonly string[]).includes(overId)
    const destStatus = (isColumn ? overId : allJobs.find((job) => job.id === overId)?.status) as JobStatus | undefined
    if (!destStatus) return

    const destJobs = jobsByStatus[destStatus].filter((job) => job.id !== activeId)
    let destIndex = destJobs.length
    if (!isColumn) {
      const overIndex = destJobs.findIndex((job) => job.id === overId)
      if (overIndex >= 0) destIndex = overIndex
    }

    onMove(activeId, destStatus, destIndex)
  }

  if (emptyBoard) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">No jobs yet</p>
        <p className="mt-1 text-sm text-zinc-500">Add a job to start tracking applications on this board.</p>
      </div>
    )
  }

  if (emptyFilter) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        No jobs match the current search or filters.
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex min-h-[28rem] gap-3 overflow-x-auto pb-4">
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobsByStatus[status]}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </DndContext>
  )
}
