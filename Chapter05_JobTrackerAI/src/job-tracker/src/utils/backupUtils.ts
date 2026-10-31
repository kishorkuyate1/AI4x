import { BACKUP_SCHEMA_VERSION, type BackupPayload, type Preferences, type ThemePreference } from '../types/backup'
import type { Job } from '../types/job'
import type { Resume } from '../types/resume'
import { datePart, todayIsoDate } from './dateUtils'
import { isJobRecord } from './validation'

export interface ImportPreview {
  payload: BackupPayload
  jobCount: number
  resumeCount: number
  errors: string[]
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function isResumeRecord(value: unknown): value is Resume {
  if (!value || typeof value !== 'object') return false
  const resume = value as Resume
  return (
    typeof resume.id === 'string' &&
    typeof resume.name === 'string' &&
    typeof resume.createdAt === 'string' &&
    typeof resume.updatedAt === 'string'
  )
}

export function buildBackup(jobs: Job[], resumes: Resume[], preferences: Preferences): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    jobs,
    resumes,
    preferences,
  }
}

export function backupFilename(exportedAt = new Date()): string {
  return `job-tracker-backup-${datePart(exportedAt.toISOString()) || todayIsoDate()}.json`
}

export function parseBackupJson(raw: string): ImportPreview {
  const errors: string[] = []
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      payload: emptyBackup(),
      jobCount: 0,
      resumeCount: 0,
      errors: ['The selected file is not valid JSON.'],
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      payload: emptyBackup(),
      jobCount: 0,
      resumeCount: 0,
      errors: ['Backup file structure is invalid.'],
    }
  }

  const data = parsed as Partial<BackupPayload>
  if (data.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version: ${String(data.schemaVersion)}. Expected ${BACKUP_SCHEMA_VERSION}.`)
  }

  const jobs = Array.isArray(data.jobs) ? data.jobs : []
  const resumes = Array.isArray(data.resumes) ? data.resumes : []

  if (!Array.isArray(data.jobs)) errors.push('Backup is missing a jobs array.')
  if (!Array.isArray(data.resumes)) errors.push('Backup is missing a resumes array.')

  const validJobs = jobs.filter((job) => {
    if (!isJobRecord(job)) {
      errors.push('One or more job records are missing required fields.')
      return false
    }
    return true
  })

  const validResumes = resumes.filter((resume) => {
    if (!isResumeRecord(resume)) {
      errors.push('One or more resume records are missing required fields.')
      return false
    }
    return true
  })

  const uniqueErrors = [...new Set(errors)]
  const theme = isTheme(data.preferences?.theme) ? data.preferences.theme : 'system'

  return {
    payload: {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
      jobs: validJobs,
      resumes: validResumes,
      preferences: { theme },
    },
    jobCount: validJobs.length,
    resumeCount: validResumes.length,
    errors: uniqueErrors,
  }
}

export function jobDedupeKey(job: Job): string {
  return [job.companyName, job.jobTitle, job.jobUrl ?? ''].map((part) => part.trim().toLowerCase()).join('|')
}

function emptyBackup(): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    jobs: [],
    resumes: [],
    preferences: { theme: 'system' },
  }
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
