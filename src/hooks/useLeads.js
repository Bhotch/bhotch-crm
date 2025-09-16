// src/hooks/useLeads.js

import { useState, useEffect, useCallback } from 'react';
import { fetchLeads as apiFetchLeads, addLead as apiAddLead } from '../api/googleSheetsService';

/**
 * A custom hook to manage all state and logic for leads.
 * @returns {object} - The leads state and functions to interact with it.
 */
export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const processLeads = (rawLeads) => {
    // Ensure data is always an array and has consistent properties.
    return (rawLeads || []).map(lead => ({
      ...lead,
      id: lead.id || `temp_${Math.random()}`,
      customerName: lead.customerName?.trim() || 'Unknown Customer',
      createdDate: lead.createdDate || new Date().toISOString(),
      status: lead.status || 'new',
    }));
  };

  const getLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetchLeads();
      if (result.success === false) {
        throw new Error(result.message || 'The script returned an error.');
      }
      setLeads(processLeads(result.data));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getLeads(); // Fetch leads on initial component mount.
  }, [getLeads]);
  
  const addLead = useCallback(async (leadData) => {
    const response = await apiAddLead(leadData);
    if (response.success) {
      await getLeads(); // Refresh the list after adding.
    }
    // The component will handle the response (e.g., show success/error message).
    return response;
  }, [getLeads]);

  return { leads, isLoading, error, refetch: getLeads, addLead };
}