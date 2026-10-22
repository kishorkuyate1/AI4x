import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getDaysSinceApplied, formatDate, STATUS_COLORS } from '../utils/constants';

export default function JobCard({ job, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const daysSinceApplied = getDaysSinceApplied(job.dateApplied);
  const statusColor = STATUS_COLORS[job.status] || STATUS_COLORS['Wishlist'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--bg-primary)] rounded-lg shadow-sm border border-[var(--border-color)] p-4 mb-3 hover:shadow-md transition-shadow ${isDragging ? 'ring-2 ring-[var(--accent-color)]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor.light} ${statusColor.text} ${statusColor.dark}`}>
              {job.status}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {job.company}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
            {job.jobTitle}
          </p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing"
            title="Drag to move"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {job.resumeUsed && (
          <div className="flex items-center text-xs text-[var(--text-secondary)]">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {job.resumeUsed}
          </div>
        )}

        <div className="flex items-center text-xs text-[var(--text-secondary)]">
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {daysSinceApplied} {daysSinceApplied === 1 ? 'day' : 'days'} ago
          <span className="ml-1 text-[var(--text-tertiary)]">
            ({formatDate(job.dateApplied)})
          </span>
        </div>

        {job.linkedinUrl && (
          <a
            href={job.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            LinkedIn
          </a>
        )}
      </div>

      {job.salaryRange && (
        <div className="mt-2 text-xs text-[var(--text-secondary)]">
          <span className="font-medium">Salary:</span> {job.salaryRange}
        </div>
      )}

      {job.notes && (
        <div className="mt-2 text-xs text-[var(--text-tertiary)] line-clamp-2">
          {job.notes}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex justify-end space-x-2">
        <button
          onClick={() => onEdit(job)}
          className="inline-flex items-center px-2.5 py-1.5 border border-[var(--border-color)] text-xs font-medium rounded text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] transition-colors"
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={() => onDelete(job)}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
