import { useDroppable } from '@dnd-kit/core';
import JobCard from './JobCard';
import { STATUS_COLORS } from '../utils/constants';

export default function KanbanColumn({ status, jobs, onEditJob, onDeleteJob }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS['Wishlist'];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-[var(--bg-secondary)] rounded-lg border ${
        isOver ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]' : 'border-[var(--border-color)]'
      } transition-colors`}
    >
      <div className={`px-4 py-3 border-b border-[var(--border-color)] ${statusColor.light} ${statusColor.dark} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${statusColor.text}`}>
            {status}
          </h3>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${statusColor.bg} text-white`}>
            {jobs.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-[200px] max-h-[calc(100vh-300px)]">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No jobs yet</p>
            <p className="text-xs mt-1">Drag jobs here or add new ones</p>
          </div>
        ) : (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEditJob}
              onDelete={onDeleteJob}
            />
          ))
        )}
      </div>
    </div>
  );
}
