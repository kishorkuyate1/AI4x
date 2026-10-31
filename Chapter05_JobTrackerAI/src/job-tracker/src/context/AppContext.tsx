import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as db from '../db/database'
import type { Preferences, ThemePreference } from '../types/backup'
import type { Job, JobDraft, JobStatus } from '../types/job'
import type { Resume } from '../types/resume'
import { backupFilename, buildBackup, downloadJson, type ImportPreview } from '../utils/backupUtils'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

interface AppContextValue {
  jobs: Job[]
  resumes: Resume[]
  preferences: Preferences
  loading: boolean
  loadError: string | null
  toasts: ToastMessage[]
  refresh: () => Promise<void>
  saveJob: (draft: JobDraft) => Promise<Job>
  removeJob: (id: string) => Promise<void>
  moveJob: (jobId: string, destStatus: JobStatus, destIndex: number) => Promise<void>
  addResume: (name: string) => Promise<Resume>
  renameResume: (id: string, name: string) => Promise<void>
  removeResume: (id: string) => Promise<void>
  setTheme: (theme: ThemePreference) => Promise<void>
  exportData: () => void
  importData: (preview: ImportPreview, mode: 'merge' | 'replace') => Promise<void>
  notify: (type: ToastMessage['type'], text: string) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function applyTheme(theme: ThemePreference): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [preferences, setPreferences] = useState<Preferences>({ theme: 'system' })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const notify = useCallback((type: ToastMessage['type'], text: string) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, type, text }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const refresh = useCallback(async () => {
    const [nextJobs, nextResumes, nextPreferences] = await Promise.all([
      db.getAllJobs(),
      db.getAllResumes(),
      db.getPreferences(),
    ])
    setJobs(nextJobs)
    setResumes(nextResumes)
    setPreferences(nextPreferences)
    applyTheme(nextPreferences.theme)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    refresh()
      .then(() => {
        if (!cancelled) setLoadError(null)
      })
      .catch((error: unknown) => {
        console.error('Failed to load Job Tracker data', error)
        if (!cancelled) setLoadError('Unable to load saved jobs from this browser.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refresh])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (preferences.theme === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preferences.theme])

  const saveJob = useCallback(
    async (draft: JobDraft) => {
      const saved = draft.id
        ? await db.updateJob({ ...(jobs.find((job) => job.id === draft.id) as Job), ...draft, id: draft.id })
        : await db.createJob(draft)
      await refresh()
      return saved
    },
    [jobs, refresh],
  )

  const removeJob = useCallback(
    async (id: string) => {
      await db.deleteJob(id)
      await refresh()
    },
    [refresh],
  )

  const moveJob = useCallback(
    async (jobId: string, destStatus: JobStatus, destIndex: number) => {
      const next = await db.persistJobMove(jobId, destStatus, destIndex)
      setJobs(next)
    },
    [],
  )

  const addResume = useCallback(
    async (name: string) => {
      const resume = await db.createResume(name)
      await refresh()
      return resume
    },
    [refresh],
  )

  const renameResume = useCallback(
    async (id: string, name: string) => {
      await db.renameResume(id, name)
      await refresh()
    },
    [refresh],
  )

  const removeResume = useCallback(
    async (id: string) => {
      await db.deleteResume(id)
      await refresh()
    },
    [refresh],
  )

  const setTheme = useCallback(async (theme: ThemePreference) => {
    await db.setThemePreference(theme)
    setPreferences({ theme })
    applyTheme(theme)
  }, [])

  const exportData = useCallback(() => {
    const payload = buildBackup(jobs, resumes, preferences)
    downloadJson(backupFilename(), payload)
    notify('success', 'Backup downloaded.')
  }, [jobs, notify, preferences, resumes])

  const importData = useCallback(
    async (preview: ImportPreview, mode: 'merge' | 'replace') => {
      if (preview.errors.length > 0) {
        throw new Error(preview.errors[0])
      }
      if (mode === 'replace') {
        await db.replaceAllData(preview.payload.jobs, preview.payload.resumes, preview.payload.preferences)
      } else {
        await db.mergeAllData(preview.payload.jobs, preview.payload.resumes, preview.payload.preferences)
      }
      await refresh()
    },
    [refresh],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      jobs,
      resumes,
      preferences,
      loading,
      loadError,
      toasts,
      refresh,
      saveJob,
      removeJob,
      moveJob,
      addResume,
      renameResume,
      removeResume,
      setTheme,
      exportData,
      importData,
      notify,
      dismissToast,
    }),
    [
      addResume,
      dismissToast,
      exportData,
      importData,
      jobs,
      loadError,
      loading,
      moveJob,
      notify,
      preferences,
      refresh,
      removeJob,
      removeResume,
      renameResume,
      resumes,
      saveJob,
      setTheme,
      toasts,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function useJobs() {
  const { jobs, saveJob, removeJob, moveJob, loading, loadError } = useApp()
  return { jobs, saveJob, removeJob, moveJob, loading, loadError }
}

export function useResumes() {
  const { resumes, addResume, renameResume, removeResume } = useApp()
  return { resumes, addResume, renameResume, removeResume }
}

export function useTheme() {
  const { preferences, setTheme } = useApp()
  return { theme: preferences.theme, setTheme }
}
