import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import JobCard from './JobCard';
import { JOB_STATUSES } from '../utils/constants';

export default function KanbanBoard({ jobs, onMoveJob, onEditJob, onDeleteJob }) {
  const [activeJob, setActiveJob] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const job = jobs.find(j => j.id === active.id);
    setActiveJob(job);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const jobId = active.id;
    const newStatus = over.id;

    const job = jobs.find(j => j.id === jobId);
    if (job && job.status !== newStatus) {
      onMoveJob(jobId, newStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveJob(null);
  };

  const getJobsByStatus = (status) => {
    return jobs.filter(job => job.status === status);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {JOB_STATUSES.map(status => (
            <KanbanColumn
              key={status.id}
              status={status.id}
              jobs={getJobsByStatus(status.id)}
              onEditJob={onEditJob}
              onDeleteJob={onDeleteJob}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeJob ? (
          <div className="drag-overlay">
            <JobCard
              job={activeJob}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
