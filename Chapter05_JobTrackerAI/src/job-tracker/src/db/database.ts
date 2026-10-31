import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '../constants'
import type { Preferences, ThemePreference } from '../types/backup'
import type { Job, JobDraft, JobStatus } from '../types/job'
import type { Resume } from '../types/resume'
import { jobDedupeKey } from '../utils/backupUtils'
import { applyStatusChange, nowIso } from '../utils/dateUtils'
import { blankToUndef } from '../utils/strings'

interface PreferenceRecord {
  key: string
  value: unknown
}

interface JobTrackerSchema extends DBSchema {
  jobs: {
    key: string
    value: Job
    indexes: {
      status: string
      dateAdded: string
      companyName: string
    }
  }
  resumes: {
    key: string
    value: Resume
    indexes: { name: string }
  }
  preferences: {
    key: string
    value: PreferenceRecord
  }
}

let dbPromise: Promise<IDBPDatabase<JobTrackerSchema>> | null = null

export function getDb(): Promise<IDBPDatabase<JobTrackerSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<JobTrackerSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('jobs')) {
          const jobs = db.createObjectStore('jobs', { keyPath: 'id' })
          jobs.createIndex('status', 'status')
          jobs.createIndex('dateAdded', 'dateAdded')
          jobs.createIndex('companyName', 'companyName')
        }
        if (!db.objectStoreNames.contains('resumes')) {
          const resumes = db.createObjectStore('resumes', { keyPath: 'id' })
          resumes.createIndex('name', 'name', { unique: false })
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

function normalizeJob(job: Job): Job {
  return {
    ...job,
    companyName: job.companyName.trim(),
    jobTitle: job.jobTitle.trim(),
    jobUrl: blankToUndef(job.jobUrl),
    resumeId: blankToUndef(job.resumeId),
    resumeName: blankToUndef(job.resumeName),
    dateApplied: blankToUndef(job.dateApplied),
    salaryRange: blankToUndef(job.salaryRange),
    location: blankToUndef(job.location),
    recruiterName: blankToUndef(job.recruiterName),
    recruiterEmail: blankToUndef(job.recruiterEmail),
    referralDetails: blankToUndef(job.referralDetails),
    notes: blankToUndef(job.notes),
  }
}

export async function getAllJobs(): Promise<Job[]> {
  const db = await getDb()
  const jobs = await db.getAll('jobs')
  return jobs.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
}

export async function getAllResumes(): Promise<Resume[]> {
  const db = await getDb()
  const resumes = await db.getAll('resumes')
  return resumes.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getPreferences(): Promise<Preferences> {
  const db = await getDb()
  const themeRecord = await db.get('preferences', 'theme')
  const theme = themeRecord?.value
  return {
    theme: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system',
  }
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  const db = await getDb()
  await db.put('preferences', { key: 'theme', value: theme })
}

export async function nextSortOrder(status: JobStatus): Promise<number> {
  const jobs = await getAllJobs()
  const column = jobs.filter((job) => job.status === status)
  if (column.length === 0) return 0
  return Math.max(...column.map((job) => job.sortOrder)) + 1
}

export async function createJob(draft: JobDraft): Promise<Job> {
  const timestamp = nowIso()
  const job = normalizeJob({
    id: crypto.randomUUID(),
    companyName: draft.companyName,
    jobTitle: draft.jobTitle,
    jobUrl: draft.jobUrl,
    resumeId: draft.resumeId,
    resumeName: draft.resumeName,
    dateAdded: timestamp,
    dateApplied: draft.dateApplied,
    salaryRange: draft.salaryRange,
    location: draft.location,
    employmentType: draft.employmentType,
    recruiterName: draft.recruiterName,
    recruiterEmail: draft.recruiterEmail,
    referralDetails: draft.referralDetails,
    notes: draft.notes,
    status: draft.status,
    sortOrder: draft.sortOrder ?? (await nextSortOrder(draft.status)),
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  const withApplied = applyStatusChange(job, job.status)
  const db = await getDb()
  await db.put('jobs', withApplied)
  return withApplied
}

export async function updateJob(job: Job): Promise<Job> {
  const existing = (await getDb()).get('jobs', job.id)
  const current = await existing
  if (!current) {
    throw new Error('Job could not be found.')
  }

  const merged = normalizeJob({
    ...current,
    ...job,
    id: current.id,
    dateAdded: current.dateAdded,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  })
  const withApplied = applyStatusChange(merged, merged.status)
  const db = await getDb()
  await db.put('jobs', withApplied)
  return withApplied
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('jobs', id)
}

export async function persistJobMove(
  jobId: string,
  destStatus: JobStatus,
  destIndex: number,
): Promise<Job[]> {
  const db = await getDb()
  const tx = db.transaction('jobs', 'readwrite')
  const store = tx.objectStore('jobs')
  const all = await store.getAll()
  const job = all.find((item) => item.id === jobId)
  if (!job) {
    throw new Error('Job could not be found.')
  }

  const sourceStatus = job.status
  const now = nowIso()
  const moved = applyStatusChange(job, destStatus)
  moved.updatedAt = now

  const destList = all
    .filter((item) => item.status === destStatus && item.id !== jobId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const clamped = Math.max(0, Math.min(destIndex, destList.length))
  destList.splice(clamped, 0, moved)

  for (let i = 0; i < destList.length; i += 1) {
    await store.put({ ...destList[i], status: destStatus, sortOrder: i, updatedAt: now })
  }

  if (sourceStatus !== destStatus) {
    const sourceList = all
      .filter((item) => item.status === sourceStatus && item.id !== jobId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    for (let i = 0; i < sourceList.length; i += 1) {
      await store.put({ ...sourceList[i], sortOrder: i, updatedAt: now })
    }
  }

  await tx.done
  return getAllJobs()
}

export async function createResume(name: string): Promise<Resume> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Resume name is required.')
  const timestamp = nowIso()
  const resume: Resume = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const db = await getDb()
  await db.put('resumes', resume)
  return resume
}

export async function renameResume(id: string, name: string): Promise<Resume> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Resume name is required.')
  const db = await getDb()
  const current = await db.get('resumes', id)
  if (!current) throw new Error('Resume could not be found.')
  const updated: Resume = { ...current, name: trimmed, updatedAt: nowIso() }
  const tx = db.transaction(['resumes', 'jobs'], 'readwrite')
  await tx.objectStore('resumes').put(updated)
  const jobs = await tx.objectStore('jobs').getAll()
  for (const job of jobs) {
    if (job.resumeId === id) {
      await tx.objectStore('jobs').put({ ...job, resumeName: trimmed, updatedAt: nowIso() })
    }
  }
  await tx.done
  return updated
}

export async function deleteResume(id: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['resumes', 'jobs'], 'readwrite')
  await tx.objectStore('resumes').delete(id)
  const jobs = await tx.objectStore('jobs').getAll()
  for (const job of jobs) {
    if (job.resumeId === id) {
      await tx.objectStore('jobs').put({
        ...job,
        resumeId: undefined,
        resumeName: job.resumeName,
        updatedAt: nowIso(),
      })
    }
  }
  await tx.done
}

export async function replaceAllData(
  jobs: Job[],
  resumes: Resume[],
  preferences: Preferences,
): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['jobs', 'resumes', 'preferences'], 'readwrite')
  await tx.objectStore('jobs').clear()
  await tx.objectStore('resumes').clear()
  await tx.objectStore('preferences').clear()
  for (const job of jobs) {
    await tx.objectStore('jobs').put(normalizeJob(job))
  }
  for (const resume of resumes) {
    await tx.objectStore('resumes').put(resume)
  }
  await tx.objectStore('preferences').put({ key: 'theme', value: preferences.theme })
  await tx.done
}

export async function mergeAllData(
  incomingJobs: Job[],
  incomingResumes: Resume[],
  preferences?: Preferences,
): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['jobs', 'resumes', 'preferences'], 'readwrite')
  const existingJobs = await tx.objectStore('jobs').getAll()
  const existingResumes = await tx.objectStore('resumes').getAll()

  const jobsById = new Map(existingJobs.map((job) => [job.id, job]))
  const jobsByKey = new Map(existingJobs.map((job) => [jobDedupeKey(job), job]))
  const resumesById = new Map(existingResumes.map((resume) => [resume.id, resume]))
  const resumesByName = new Map(existingResumes.map((resume) => [resume.name.trim().toLowerCase(), resume]))

  for (const resume of incomingResumes) {
    const byId = resumesById.get(resume.id)
    const byName = resumesByName.get(resume.name.trim().toLowerCase())
    if (byId) {
      await tx.objectStore('resumes').put({ ...byId, ...resume, id: byId.id })
    } else if (byName) {
      continue
    } else {
      await tx.objectStore('resumes').put(resume)
      resumesById.set(resume.id, resume)
      resumesByName.set(resume.name.trim().toLowerCase(), resume)
    }
  }

  for (const job of incomingJobs) {
    const byId = jobsById.get(job.id)
    const byKey = jobsByKey.get(jobDedupeKey(job))
    if (byId) {
      await tx.objectStore('jobs').put(normalizeJob({ ...byId, ...job, id: byId.id }))
    } else if (byKey) {
      continue
    } else {
      await tx.objectStore('jobs').put(normalizeJob(job))
      jobsById.set(job.id, job)
      jobsByKey.set(jobDedupeKey(job), job)
    }
  }

  if (preferences) {
    await tx.objectStore('preferences').put({ key: 'theme', value: preferences.theme })
  }

  await tx.done
}
