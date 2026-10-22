import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/db';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allJobs = await db.getAllJobs();
      setJobs(allJobs);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const addJob = useCallback(async (jobData) => {
    try {
      setError(null);
      const newJob = await db.addJob(jobData);
      setJobs(prev => [...prev, newJob]);
      return newJob;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateJob = useCallback(async (jobData) => {
    try {
      setError(null);
      const updatedJob = await db.updateJob(jobData);
      setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      return updatedJob;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteJob = useCallback(async (id) => {
    try {
      setError(null);
      await db.deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const moveJob = useCallback(async (jobId, newStatus) => {
    try {
      setError(null);
      const job = jobs.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');
      
      const updatedJob = await db.updateJob({
        ...job,
        status: newStatus,
      });
      setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      return updatedJob;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [jobs]);

  const exportJobs = useCallback(async () => {
    try {
      setError(null);
      return await db.exportJobs();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const importJobs = useCallback(async (jsonString) => {
    try {
      setError(null);
      const result = await db.importJobs(jsonString);
      if (result.success) {
        await loadJobs();
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadJobs]);

  const getJobsByStatus = useCallback((status) => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  const searchJobs = useCallback((query) => {
    if (!query) return jobs;
    const lowerQuery = query.toLowerCase();
    return jobs.filter(job =>
      job.company.toLowerCase().includes(lowerQuery) ||
      job.jobTitle.toLowerCase().includes(lowerQuery)
    );
  }, [jobs]);

  return {
    jobs,
    loading,
    error,
    addJob,
    updateJob,
    deleteJob,
    moveJob,
    exportJobs,
    importJobs,
    getJobsByStatus,
    searchJobs,
    refreshJobs: loadJobs,
  };
}
