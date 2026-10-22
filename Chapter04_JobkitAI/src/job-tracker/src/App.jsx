import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import KanbanBoard from './components/KanbanBoard';
import JobFormModal from './components/JobFormModal';
import DeleteConfirmation from './components/DeleteConfirmation';
import { useJobs } from './hooks/useJobs';

function App() {
  const {
    jobs,
    loading,
    error,
    addJob,
    updateJob,
    deleteJob,
    moveJob,
    exportJobs,
    importJobs,
    searchJobs,
  } = useJobs();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const filtered = searchJobs(searchQuery);
    setFilteredJobs(filtered);
  }, [jobs, searchQuery, searchJobs]);

  const handleAddJob = useCallback(() => {
    setEditingJob(null);
    setShowJobForm(true);
  }, []);

  const handleEditJob = useCallback((job) => {
    setEditingJob(job);
    setShowJobForm(true);
  }, []);

  const handleDeleteJob = useCallback((job) => {
    setDeletingJob(job);
  }, []);

  const handleSaveJob = useCallback(async (jobData) => {
    try {
      if (editingJob) {
        await updateJob(jobData);
      } else {
        await addJob(jobData);
      }
      setShowJobForm(false);
      setEditingJob(null);
    } catch (error) {
      console.error('Failed to save job:', error);
      alert('Failed to save job. Please try again.');
    }
  }, [editingJob, addJob, updateJob]);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingJob) {
      try {
        await deleteJob(deletingJob.id);
        setDeletingJob(null);
      } catch (error) {
        console.error('Failed to delete job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  }, [deletingJob, deleteJob]);

  const handleMoveJob = useCallback(async (jobId, newStatus) => {
    try {
      await moveJob(jobId, newStatus);
    } catch (error) {
      console.error('Failed to move job:', error);
      alert('Failed to move job. Please try again.');
    }
  }, [moveJob]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const jsonData = await exportJobs();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export jobs. Please try again.');
    }
  }, [exportJobs]);

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonString = event.target.result;
          const result = await importJobs(jsonString);
          
          if (result.success) {
            alert(`Successfully imported ${result.count} jobs!`);
          } else {
            alert(`Import failed: ${result.error}`);
          }
        } catch (error) {
          console.error('Import failed:', error);
          alert('Failed to import jobs. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [importJobs]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-secondary)]">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header
        onAddJob={handleAddJob}
        onExport={handleExport}
        onImport={handleImport}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <SearchBar
        onSearch={handleSearch}
        jobCount={filteredJobs.length}
      />

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <KanbanBoard
        jobs={filteredJobs}
        onMoveJob={handleMoveJob}
        onEditJob={handleEditJob}
        onDeleteJob={handleDeleteJob}
      />

      {showJobForm && (
        <JobFormModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => {
            setShowJobForm(false);
            setEditingJob(null);
          }}
        />
      )}

      {deletingJob && (
        <DeleteConfirmation
          job={deletingJob}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingJob(null)}
        />
      )}
    </div>
  );
}

export default App;
