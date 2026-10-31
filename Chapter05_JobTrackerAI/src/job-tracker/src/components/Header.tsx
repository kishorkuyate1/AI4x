import { Briefcase, Download, FileText, Plus, Upload } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onAddJob: () => void
  onResumes: () => void
  onExport: () => void
  onImport: () => void
}

export function Header({ onAddJob, onResumes, onExport, onImport }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Job Tracker</h1>
          <p className="text-sm text-zinc-500">Local-first Kanban for applications</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAddJob}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Plus className="h-4 w-4" />
          Add job
        </button>
        <button
          type="button"
          onClick={onResumes}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
        >
          <FileText className="h-4 w-4" />
          Resumes
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
        >
          <Upload className="h-4 w-4" />
          Import
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
