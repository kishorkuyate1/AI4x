export const JOB_STATUSES = [
  'Wishlist',
  'Applied',
  'Follow-up',
  'Interview',
  'Offer',
  'Rejected',
] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
] as const

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export interface Job {
  id: string
  companyName: string
  jobTitle: string
  jobUrl?: string
  resumeId?: string
  resumeName?: string
  dateAdded: string
  dateApplied?: string
  salaryRange?: string
  location?: string
  employmentType?: EmploymentType
  recruiterName?: string
  recruiterEmail?: string
  referralDetails?: string
  notes?: string
  status: JobStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type JobDraft = Omit<Job, 'id' | 'dateAdded' | 'createdAt' | 'updatedAt' | 'sortOrder'> & {
  id?: string
  dateAdded?: string
  createdAt?: string
  updatedAt?: string
  sortOrder?: number
}
