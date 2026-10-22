import { STORE_NAME, generateId } from '../utils/constants';

function getAllFromStorage() {
  const data = localStorage.getItem(STORE_NAME);
  return data ? JSON.parse(data) : [];
}

function saveAllToStorage(jobs) {
  localStorage.setItem(STORE_NAME, JSON.stringify(jobs));
}

export async function addJob(jobData) {
  const jobs = getAllFromStorage();
  const job = {
    id: generateId(),
    company: jobData.company || '',
    jobTitle: jobData.jobTitle || '',
    linkedinUrl: jobData.linkedinUrl || '',
    resumeUsed: jobData.resumeUsed || '',
    dateApplied: jobData.dateApplied || new Date().toISOString().split('T')[0],
    salaryRange: jobData.salaryRange || '',
    notes: jobData.notes || '',
    status: jobData.status || 'Wishlist',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.push(job);
  saveAllToStorage(jobs);
  return job;
}

export async function getAllJobs() {
  return getAllFromStorage();
}

export async function getJobById(id) {
  const jobs = getAllFromStorage();
  return jobs.find(j => j.id === id) || null;
}

export async function updateJob(jobData) {
  const jobs = getAllFromStorage();
  const index = jobs.findIndex(j => j.id === jobData.id);
  if (index === -1) {
    throw new Error('Job not found');
  }
  const updatedJob = {
    ...jobs[index],
    ...jobData,
    updatedAt: new Date().toISOString(),
  };
  jobs[index] = updatedJob;
  saveAllToStorage(jobs);
  return updatedJob;
}

export async function deleteJob(id) {
  const jobs = getAllFromStorage();
  const filtered = jobs.filter(j => j.id !== id);
  saveAllToStorage(filtered);
}

export async function exportJobs() {
  const jobs = getAllFromStorage();
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    jobs: jobs,
  };
  return JSON.stringify(exportData, null, 2);
}

export async function importJobs(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!data.jobs || !Array.isArray(data.jobs)) {
      throw new Error('Invalid import format: missing jobs array');
    }

    const existingJobs = getAllFromStorage();
    const existingIds = new Set(existingJobs.map(j => j.id));

    let importedCount = 0;
    for (const job of data.jobs) {
      if (!job.company || !job.jobTitle) {
        continue;
      }

      const jobToImport = {
        id: job.id && !existingIds.has(job.id) ? job.id : generateId(),
        company: job.company,
        jobTitle: job.jobTitle,
        linkedinUrl: job.linkedinUrl || '',
        resumeUsed: job.resumeUsed || '',
        dateApplied: job.dateApplied || new Date().toISOString().split('T')[0],
        salaryRange: job.salaryRange || '',
        notes: job.notes || '',
        status: job.status || 'Wishlist',
        createdAt: job.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      existingJobs.push(jobToImport);
      importedCount++;
    }

    saveAllToStorage(existingJobs);
    return { success: true, count: importedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function clearAllJobs() {
  localStorage.removeItem(STORE_NAME);
}
