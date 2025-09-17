import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService } from '../api/googleSheetsService';

export function useJobCounts(addNotification) {
    const [jobCounts, setJobCounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load job counts from API
    const loadJobCountsData = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh) setLoading(true);

        try {
            const response = await googleSheetsService.fetchJobCounts();

            if (response.success) {
                const processedJobCounts = (response.data || response.jobCounts || [])
                    .map((jobCount, index) => ({
                        ...jobCount,
                        // Ensure we have an ID field
                        id: jobCount.id || `jobcount_${Date.now()}_${index}`,
                        // Format name for display
                        fullName: jobCount.customerName ||
                                 `${jobCount.firstName || ''} ${jobCount.lastName || ''}`.trim() ||
                                 'Unknown Customer'
                    }))
                    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                setJobCounts(processedJobCounts);

                const message = isManualRefresh
                    ? `Job counts refreshed. Found ${processedJobCounts.length} records.`
                    : `Job counts loaded. Found ${processedJobCounts.length} records.`;

                addNotification(message, 'success');
            } else {
                addNotification(`Error fetching job counts: ${response.message}`, 'error');
            }
        } catch (error) {
            addNotification(`Error loading job counts: ${error.message}`, 'error');
        } finally {
            if (!isManualRefresh) setLoading(false);
        }
    }, [addNotification]);

    // Load data on component mount
    useEffect(() => {
        loadJobCountsData();
    }, [loadJobCountsData]);

    // Add new job count
    const addJobCount = useCallback(async (jobCountData) => {
        try {
            const response = await googleSheetsService.addJobCount(jobCountData);

            if (response.success && response.jobCount) {
                const newJobCount = {
                    ...response.jobCount,
                    id: response.jobCount.id || `jobcount_${Date.now()}`,
                    fullName: response.jobCount.customerName ||
                             `${response.jobCount.firstName || ''} ${response.jobCount.lastName || ''}`.trim() ||
                             'Unknown Customer'
                };

                setJobCounts(prev => [newJobCount, ...prev].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
                addNotification(`Job count added: ${newJobCount.fullName}`, 'success');
            } else {
                addNotification(`Error adding job count: ${response.message}`, 'error');
            }

            return response;
        } catch (error) {
            addNotification(`Error adding job count: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }, [addNotification]);

    // Update existing job count
    const updateJobCount = useCallback(async (updatedJobCount) => {
        try {
            const response = await googleSheetsService.updateJobCount(updatedJobCount);

            if (response.success && response.jobCount) {
                const updatedData = {
                    ...response.jobCount,
                    id: response.jobCount.id || updatedJobCount.id,
                    fullName: response.jobCount.customerName ||
                             `${response.jobCount.firstName || ''} ${response.jobCount.lastName || ''}`.trim() ||
                             'Unknown Customer'
                };

                setJobCounts(prev => prev.map(jc => (jc.id === updatedData.id ? updatedData : jc)));
                addNotification(`Job count updated: ${updatedData.fullName}`, 'info');
            } else {
                addNotification(`Error updating job count: ${response.message}`, 'error');
            }

            return response;
        } catch (error) {
            addNotification(`Error updating job count: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }, [addNotification]);

    // Delete job count
    const deleteJobCount = useCallback(async (jobCountId) => {
        const jobCountToDelete = jobCounts.find(jc => jc.id === jobCountId);
        if (!jobCountToDelete) {
            addNotification('Job count not found', 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to delete the job count for ${jobCountToDelete.fullName}?`;
        if (window.confirm(confirmMessage)) {
            try {
                const response = await googleSheetsService.deleteJobCount(jobCountId);

                if (response.success) {
                    setJobCounts(currentJobCounts => currentJobCounts.filter(jc => jc.id !== jobCountId));
                    addNotification(`Job count deleted: ${jobCountToDelete.fullName}`, 'info');
                } else {
                    addNotification(`Error deleting job count: ${response.message}`, 'error');
                }
            } catch (error) {
                addNotification(`Error deleting job count: ${error.message}`, 'error');
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