import { useState, useEffect } from 'react';
import { JOB_STATUSES, RESUME_OPTIONS } from '../utils/constants';

export default function JobFormModal({ job, onSave, onClose }) {
  const isEditing = !!job;

  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    linkedinUrl: '',
    resumeUsed: '',
    dateApplied: new Date().toISOString().split('T')[0],
    salaryRange: '',
    notes: '',
    status: 'Wishlist',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (job) {
      setFormData({
        company: job.company || '',
        jobTitle: job.jobTitle || '',
        linkedinUrl: job.linkedinUrl || '',
        resumeUsed: job.resumeUsed || '',
        dateApplied: job.dateApplied || new Date().toISOString().split('T')[0],
        salaryRange: job.salaryRange || '',
        notes: job.notes || '',
        status: job.status || 'Wishlist',
      });
    }
  }, [job]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSave({
        ...job,
        ...formData,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 modal-backdrop"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-[var(--bg-primary)] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-fade-in">
          <form onSubmit={handleSubmit}>
            <div className="bg-[var(--bg-primary)] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {isEditing ? 'Edit Job' : 'Add New Job'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-[var(--text-primary)]">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.company ? 'border-red-500' : 'border-[var(--border-color)]'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]`}
                    placeholder="Enter company name"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-500">{errors.company}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-[var(--text-primary)]">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.jobTitle ? 'border-red-500' : 'border-[var(--border-color)]'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]`}
                    placeholder="Enter job title"
                  />
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm text-red-500">{errors.jobTitle}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-[var(--text-primary)]">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.linkedinUrl ? 'border-red-500' : 'border-[var(--border-color)]'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]`}
                    placeholder="https://www.linkedin.com/jobs/..."
                  />
                  {errors.linkedinUrl && (
                    <p className="mt-1 text-sm text-red-500">{errors.linkedinUrl}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="resumeUsed" className="block text-sm font-medium text-[var(--text-primary)]">
                    Resume Used
                  </label>
                  <select
                    id="resumeUsed"
                    name="resumeUsed"
                    value={formData.resumeUsed}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-[var(--border-color)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option value="">Select a resume</option>
                    {RESUME_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dateApplied" className="block text-sm font-medium text-[var(--text-primary)]">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    id="dateApplied"
                    name="dateApplied"
                    value={formData.dateApplied}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-[var(--border-color)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="salaryRange" className="block text-sm font-medium text-[var(--text-primary)]">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    id="salaryRange"
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-[var(--border-color)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-[var(--text-primary)]">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-[var(--border-color)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    {JOB_STATUSES.map(status => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-[var(--text-primary)]">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full border border-[var(--border-color)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    placeholder="Add any notes about this job..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-secondary)] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--accent-color)] text-base font-medium text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Add Job'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-[var(--border-color)] shadow-sm px-4 py-2 bg-[var(--bg-primary)] text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
