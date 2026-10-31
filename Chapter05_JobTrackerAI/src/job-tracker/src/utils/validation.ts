import { EMPLOYMENT_TYPES, JOB_STATUSES, type EmploymentType, type Job, type JobStatus } from '../types/job'
import { blankToUndef } from './strings'

export interface FieldErrors {
  companyName?: string
  jobTitle?: string
  jobUrl?: string
  recruiterEmail?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value)
}

export function isEmploymentType(value: unknown): value is EmploymentType {
  return typeof value === 'string' && (EMPLOYMENT_TYPES as readonly string[]).includes(value)
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value)
}

export function validateJobFields(input: {
  companyName: string
  jobTitle: string
  jobUrl?: string
  recruiterEmail?: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.companyName.trim()) errors.companyName = 'Company name is required.'
  if (!input.jobTitle.trim()) errors.jobTitle = 'Job title is required.'

  const url = blankToUndef(input.jobUrl)
  if (url && !isValidHttpUrl(url)) {
    errors.jobUrl = 'Enter a valid http(s) URL.'
  }

  const email = blankToUndef(input.recruiterEmail)
  if (email && !isValidEmail(email)) {
    errors.recruiterEmail = 'Enter a valid email address.'
  }

  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function isJobRecord(value: unknown): value is Job {
  if (!value || typeof value !== 'object') return false
  const job = value as Job
  return (
    typeof job.id === 'string' &&
    typeof job.companyName === 'string' &&
    typeof job.jobTitle === 'string' &&
    isJobStatus(job.status) &&
    typeof job.dateAdded === 'string' &&
    typeof job.createdAt === 'string' &&
    typeof job.updatedAt === 'string' &&
    typeof job.sortOrder === 'number'
  )
}
