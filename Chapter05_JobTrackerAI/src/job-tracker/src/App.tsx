import { useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DashboardStats } from './components/DashboardStats'
import { Header } from './components/Header'
import { JobForm } from './components/JobForm'
import { KanbanBoard } from './components/KanbanBoard'
import { ResumeManager } from './components/ResumeManager'
import { SearchFilters } from './components/SearchFilters'
import { Toast } from './components/Toast'
import { AppProvider, useApp } from './context/AppContext'
import { defaultFilters, filterAndSortJobs, isFilterActive, type JobFilters } from './filters'
import { JOB_STATUSES, type Job, type JobStatus } from './types/job'
import { parseBackupJson, type ImportPreview } from './utils/backupUtils'

function AppShell() {
  const { jobs, resumes, loading, loadError, saveJob, removeJob, moveJob, exportData, importData, notify } = useApp()
  const [filters, setFilters] = useState<JobFilters>(defaultFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)
  const [deleting, setDeleting] = useState<Job | null>(null)
  const [resumesOpen, setResumesOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [replaceConfirm, setReplaceConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const visibleJobs = useMemo(() => filterAndSortJobs(jobs, filters), [filters, jobs])
  const jobsByStatus = useMemo(() => {
    const grouped = Object.fromEntries(JOB_STATUSES.map((status) => [status, [] as Job[]])) as Record<JobStatus, Job[]>
    for (const job of visibleJobs) {
      grouped[job.status].push(job)
    }
    return grouped
  }, [visibleJobs])

  const locations = useMemo(
    () => [...new Set(jobs.map((job) => job.location).filter((value): value is string => Boolean(value)))].sort(),
    [jobs],
  )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (job: Job) => {
    setEditing(job)
    setFormOpen(true)
  }

  const onStatusChange = async (job: Job, status: JobStatus) => {
    if (job.status === status) return
    try {
      await saveJob({ ...job, status })
    } catch (error) {
      console.error(error)
      notify('error', 'Unable to update job status.')
    }
  }

  const onMove = async (jobId: string, destStatus: JobStatus, destIndex: number) => {
    try {
      await moveJob(jobId, destStatus, destIndex)
    } catch (error) {
      console.error(error)
      notify('error', 'Unable to move job.')
    }
  }

  const onPickImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const raw = await file.text()
      const preview = parseBackupJson(raw)
      if (preview.errors.length > 0 && preview.jobCount === 0 && preview.resumeCount === 0) {
        notify('error', preview.errors[0])
        return
      }
      setImportPreview(preview)
    } catch (error) {
      console.error(error)
      notify('error', 'Unable to read the selected backup file.')
    }
  }

  const runImport = async (mode: 'merge' | 'replace') => {
    if (!importPreview) return
    try {
      await importData(importPreview, mode)
      notify('success', mode === 'replace' ? 'Data replaced from backup.' : 'Backup merged.')
      setImportPreview(null)
      setReplaceConfirm(false)
    } catch (error) {
      console.error(error)
      notify('error', 'Import failed. Existing data was left unchanged.')
    }
  }

  return (
    <div className="min-h-svh bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6">
        <Header
          onAddJob={openCreate}
          onResumes={() => setResumesOpen(true)}
          onExport={exportData}
          onImport={() => fileRef.current?.click()}
        />

        {loadError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
            {loadError}
          </p>
        ) : null}

        {loading ? (
          <p className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            Loading saved jobs…
          </p>
        ) : (
          <>
            <DashboardStats jobs={jobs} />
            <SearchFilters filters={filters} resumes={resumes} locations={locations} onChange={setFilters} />
            <KanbanBoard
              jobsByStatus={jobsByStatus}
              emptyBoard={jobs.length === 0}
              emptyFilter={jobs.length > 0 && visibleJobs.length === 0 && isFilterActive(filters)}
              onEdit={openEdit}
              onDelete={setDeleting}
              onStatusChange={(job, status) => void onStatusChange(job, status)}
              onMove={(jobId, status, index) => void onMove(jobId, status, index)}
            />
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void onPickImport(file)
        }}
      />

      <JobForm open={formOpen} job={editing} onClose={() => setFormOpen(false)} />
      <ResumeManager open={resumesOpen} onClose={() => setResumesOpen(false)} />
      <Toast />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete job?"
        message={
          deleting
            ? `Delete ${deleting.companyName} — ${deleting.jobTitle}? This cannot be undone.`
            : ''
        }
        confirmLabel="Confirm delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          void removeJob(deleting.id)
            .then(() => notify('success', 'Job deleted.'))
            .catch((error) => {
              console.error(error)
              notify('error', 'Unable to delete job.')
            })
            .finally(() => setDeleting(null))
        }}
      />

      {importPreview ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Import backup</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {importPreview.jobCount} jobs and {importPreview.resumeCount} resume names found.
            </p>
            {importPreview.errors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-rose-600">
                {importPreview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
                onClick={() => setImportPreview(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
                disabled={importPreview.errors.length > 0}
                onClick={() => void runImport('merge')}
              >
                Merge
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={importPreview.errors.length > 0}
                onClick={() => setReplaceConfirm(true)}
              >
                Replace existing
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={replaceConfirm}
        title="Replace all data?"
        message="This will delete all current jobs and resume names, then load the backup."
        confirmLabel="Replace data"
        danger
        onCancel={() => setReplaceConfirm(false)}
        onConfirm={() => void runImport('replace')}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
