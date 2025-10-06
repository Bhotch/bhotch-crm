import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService } from '../api/googleSheetsService';
import { jobCountsService } from '../api/supabaseService';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

export function useJobCounts(addNotification) {
    const [jobCounts, setJobCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const useSupabase = isSupabaseEnabled();

    // Load job counts from API
    const loadJobCountsData = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh) setLoading(true);

        try {
            if (useSupabase) {
                // Use Supabase - job counts are now part of the leads table
                const data = await jobCountsService.getAll();
                const processedJobCounts = data.map(jc => ({
                    ...jc,
                    fullName: jc.customer_name || 'Unknown Customer',
                    customerName: jc.customer_name,
                    address: jc.address
                }));
                setJobCounts(processedJobCounts);

                const message = isManualRefresh
                    ? `Job counts refreshed. Found ${processedJobCounts.length} records.`
                    : `Job counts loaded. Found ${processedJobCounts.length} records.`;

                addNotification(message, 'success');
            } else {
                // Fallback to Google Sheets
                const response = await googleSheetsService.fetchJobCounts();

                if (response.success) {
                    const processedJobCounts = (response.data || response.jobCounts || [])
                        .map((jobCount, index) => ({
                            ...jobCount,
                            id: jobCount.id || `jobcount_${Date.now()}_${index}`,
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
            }
        } catch (error) {
            addNotification(`Error loading job counts: ${error.message}`, 'error');
        } finally {
            if (!isManualRefresh) setLoading(false);
        }
    }, [addNotification, useSupabase]);

    // Load data on component mount
    useEffect(() => {
        loadJobCountsData();
    }, [loadJobCountsData]);

    // Set up real-time subscription if using Supabase
    useEffect(() => {
        if (useSupabase) {
            const subscription = supabase
                .channel('job-counts-changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'leads'  // Job counts are now part of the leads table
                }, async (payload) => {
                    console.log('Lead/Job count changed:', payload);
                    // Refresh job counts data
                    await loadJobCountsData(true);
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [loadJobCountsData, useSupabase]);

    // Add new job count
    const addJobCount = useCallback(async (jobCountData) => {
        try {
            if (useSupabase) {
                const newJobCount = await jobCountsService.create(jobCountData);
                addNotification(`Job count added`, 'success');
                await loadJobCountsData(true); // Refresh to get joined data
                return { success: true, jobCount: newJobCount };
            } else {
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
            }
        } catch (error) {
            addNotification(`Error adding job count: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }, [addNotification, useSupabase, loadJobCountsData]);

    // Update existing job count
    const updateJobCount = useCallback(async (updatedJobCount) => {
        try {
            if (useSupabase) {
                await jobCountsService.update(updatedJobCount.id, updatedJobCount);
                addNotification(`Job count updated`, 'info');
                await loadJobCountsData(true); // Refresh to get joined data
                return { success: true };
            } else {
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
            }
        } catch (error) {
            addNotification(`Error updating job count: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }, [addNotification, useSupabase, loadJobCountsData]);

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
                if (useSupabase) {
                    await jobCountsService.delete(jobCountId);
                    setJobCounts(currentJobCounts => currentJobCounts.filter(jc => jc.id !== jobCountId));
                    addNotification(`Job count deleted: ${jobCountToDelete.fullName}`, 'info');
                } else {
                    const response = await googleSheetsService.deleteJobCount(jobCountId);

                    if (response.success) {
                        setJobCounts(currentJobCounts => currentJobCounts.filter(jc => jc.id !== jobCountId));
                        addNotification(`Job count deleted: ${jobCountToDelete.fullName}`, 'info');
                    } else {
                        addNotification(`Error deleting job count: ${response.message}`, 'error');
                    }
                }
            } catch (error) {
                addNotification(`Error deleting job count: ${error.message}`, 'error');
            }
        }
    }, [jobCounts, addNotification, useSupabase]);

    return {
        jobCounts,
        loading,
        refreshJobCounts: () => loadJobCountsData(true),
        addJobCount,
        updateJobCount,
        deleteJobCount
    };
}