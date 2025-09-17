import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService } from '../api/googleSheetsService';

export function useJobCounts(addNotification) {
  const [jobCounts, setJobCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobCountsData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setLoading(true);

    const response = await googleSheetsService.fetchJobCounts();

    if (response.success) {
      const processedJobCounts = (response.data || response.jobCounts || [])
        .map(jobCount => ({
          ...jobCount,
          // Ensure we have an ID field
          id: jobCount.id || `${jobCount.firstName}_${jobCount.lastName}_${jobCount.date}`,
          // Format name for display
          fullName: `${jobCount.firstName || ''} ${jobCount.lastName || ''}`.trim() || 'Unknown'
        }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      setJobCounts(processedJobCounts);

      if (isManualRefresh) {
        addNotification(`Job counts refreshed. Found ${processedJobCounts.length} records.`, 'success');
      } else {
        addNotification(`Job counts loaded. Found ${processedJobCounts.length} records.`, 'success');
      }
    } else {
      addNotification(`Error fetching job counts: ${response.message}`, 'error');
    }

    if (!isManualRefresh) setLoading(false);
  }, [addNotification]);

  useEffect(() => {
    loadJobCountsData();
  }, [loadJobCountsData]);

  const addJobCount = useCallback(async (jobCountData) => {
    const response = await googleSheetsService.addJobCount(jobCountData);

    if (response.success && response.jobCount) {
      const newJobCount = {
        ...response.jobCount,
        id: response.jobCount.id || `${response.jobCount.firstName}_${response.jobCount.lastName}_${response.jobCount.date}`,
        fullName: `${response.jobCount.firstName || ''} ${response.jobCount.lastName || ''}`.trim() || 'Unknown'
      };

      setJobCounts(prev => [newJobCount, ...prev].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      addNotification(`Job count added: ${newJobCount.fullName}`, 'success');
    } else {
      addNotification(`Error adding job count: ${response.message}`, 'error');
    }

    return response;
  }, [addNotification]);

  const updateJobCount = useCallback(async (updatedJobCount) => {
    const response = await googleSheetsService.updateJobCount(updatedJobCount);

    if (response.success && response.jobCount) {
      const updatedData = {
        ...response.jobCount,
        id: response.jobCount.id || updatedJobCount.id,
        fullName: `${response.jobCount.firstName || ''} ${response.jobCount.lastName || ''}`.trim() || 'Unknown'
      };

      setJobCounts(prev => prev.map(jc => (jc.id === updatedData.id ? updatedData : jc)));
      addNotification(`Job count updated: ${updatedData.fullName}`, 'info');
    } else {
      addNotification(`Error updating job count: ${response.message}`, 'error');
    }

    return response;
  }, [addNotification]);

  const deleteJobCount = useCallback(async (jobCountId) => {
    const jobCountToDelete = jobCounts.find(jc => jc.id === jobCountId);
    if (!jobCountToDelete) return;

    if (window.confirm(`Are you sure you want to delete the job count for ${jobCountToDelete.fullName}?`)) {
      const response = await googleSheetsService.deleteJobCount(jobCountId);

      if (response.success) {
        setJobCounts(currentJobCounts => currentJobCounts.filter(jc => jc.id !== jobCountId));
        addNotification(`Job count deleted: ${jobCountToDelete.fullName}`, 'warning');
      } else {
        addNotification(`Error deleting job count: ${response.message}`, 'error');
      }
    }
  }, [jobCounts, addNotification]);

  return {
    jobCounts,
    loading,
    refreshJobCounts: () => loadJobCountsData(true),
    addJobCount,
    updateJobCount,
    deleteJobCount
  };
}