import type { Job } from './job'
import type { Resume } from './resume'

export const BACKUP_SCHEMA_VERSION = 1

export type ThemePreference = 'light' | 'dark' | 'system'

export interface Preferences {
  theme: ThemePreference
}

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  jobs: Job[]
  resumes: Resume[]
  preferences: Preferences
}
