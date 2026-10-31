import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { inputClass, labelClass } from '../constants'
import { useApp } from '../context/AppContext'
import { EMPLOYMENT_TYPES, JOB_STATUSES, type EmploymentType, type Job, type JobStatus } from '../types/job'
import { hasFieldErrors, validateJobFields, type FieldErrors } from '../utils/validation'

interface JobFormProps {
  open: boolean
  job: Job | null
  onClose: () => void
}

interface FormState {
  companyName: string
  jobTitle: string
  jobUrl: string
  resumeId: string
  newResumeName: string
  dateApplied: string
  salaryRange: string
  location: string
  employmentType: string
  recruiterName: string
  recruiterEmail: string
  referralDetails: string
  notes: string
  status: JobStatus
}

const emptyForm: FormState = {
  companyName: '',
  jobTitle: '',
  jobUrl: '',
  resumeId: '',
  newResumeName: '',
  dateApplied: '',
  salaryRange: '',
  location: '',
  employmentType: '',
  recruiterName: '',
  recruiterEmail: '',
  referralDetails: '',
  notes: '',
  status: 'Wishlist',
}

export function JobForm({ open, job, onClose }: JobFormProps) {
  const { saveJob, resumes, addResume, notify } = useApp()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (job) {
      setForm({
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        jobUrl: job.jobUrl ?? '',
        resumeId: job.resumeId ?? '',
        newResumeName: '',
        dateApplied: job.dateApplied ?? '',
        salaryRange: job.salaryRange ?? '',
        location: job.location ?? '',
        employmentType: job.employmentType ?? '',
        recruiterName: job.recruiterName ?? '',
        recruiterEmail: job.recruiterEmail ?? '',
        referralDetails: job.referralDetails ?? '',
        notes: job.notes ?? '',
        status: job.status,
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
    setSubmitError(null)
    setSubmitting(false)
  }, [job, open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  if (!open) return null

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validateJobFields(form)
    setErrors(nextErrors)
    if (hasFieldErrors(nextErrors)) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      let resumeId = form.resumeId || undefined
      let resumeName = resumes.find((resume) => resume.id === resumeId)?.name
      if (!resumeId && form.newResumeName.trim()) {
        const created = await addResume(form.newResumeName.trim())
        resumeId = created.id
        resumeName = created.name
      }

      await saveJob({
        id: job?.id,
        companyName: form.companyName,
        jobTitle: form.jobTitle,
        jobUrl: form.jobUrl,
        resumeId,
        resumeName: resumeName ?? job?.resumeName,
        dateApplied: form.dateApplied || undefined,
        salaryRange: form.salaryRange,
        location: form.location,
        employmentType: (form.employmentType || undefined) as EmploymentType | undefined,
        recruiterName: form.recruiterName,
        recruiterEmail: form.recruiterEmail,
        referralDetails: form.referralDetails,
        notes: form.notes,
        status: form.status,
      })
      notify('success', job ? 'Job updated.' : 'Job added.')
      onClose()
    } catch (error) {
      console.error('Failed to save job', error)
      setSubmitError('Unable to save this job. Please try again.')
      notify('error', 'Unable to save this job.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-zinc-950/40">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {job ? 'Edit job' : 'Add job'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Field label="Company name" required error={errors.companyName}>
            <input
              className={inputClass}
              value={form.companyName}
              onChange={(event) => setField('companyName', event.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Job title" required error={errors.jobTitle}>
            <input
              className={inputClass}
              value={form.jobTitle}
              onChange={(event) => setField('jobTitle', event.target.value)}
            />
          </Field>
          <Field label="Job URL" error={errors.jobUrl}>
            <input
              className={inputClass}
              value={form.jobUrl}
              onChange={(event) => setField('jobUrl', event.target.value)}
              placeholder="https://linkedin.com/jobs/..."
            />
          </Field>
          <Field label="Resume used">
            <select className={inputClass} value={form.resumeId} onChange={(event) => setField('resumeId', event.target.value)}>
              <option value="">Select a resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Or add a new resume name">
            <input
              className={inputClass}
              value={form.newResumeName}
              onChange={(event) => setField('newResumeName', event.target.value)}
              placeholder="QA_Lead_Resume_v1"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(event) => setField('status', event.target.value as JobStatus)}>
                {JOB_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date applied">
              <input
                type="date"
                className={inputClass}
                value={form.dateApplied}
                onChange={(event) => setField('dateApplied', event.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary range">
              <input
                className={inputClass}
                value={form.salaryRange}
                onChange={(event) => setField('salaryRange', event.target.value)}
                placeholder="₹25–30 LPA"
              />
            </Field>
            <Field label="Location">
              <input
                className={inputClass}
                value={form.location}
                onChange={(event) => setField('location', event.target.value)}
                placeholder="Remote, Bengaluru..."
              />
            </Field>
          </div>
          <Field label="Employment type">
            <select
              className={inputClass}
              value={form.employmentType}
              onChange={(event) => setField('employmentType', event.target.value)}
            >
              <option value="">Select type</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Recruiter name">
            <input className={inputClass} value={form.recruiterName} onChange={(event) => setField('recruiterName', event.target.value)} />
          </Field>
          <Field label="Recruiter email" error={errors.recruiterEmail}>
            <input
              className={inputClass}
              value={form.recruiterEmail}
              onChange={(event) => setField('recruiterEmail', event.target.value)}
            />
          </Field>
          <Field label="Referral details">
            <input
              className={inputClass}
              value={form.referralDetails}
              onChange={(event) => setField('referralDetails', event.target.value)}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-24`}
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
            />
          </Field>
          {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  )
}
