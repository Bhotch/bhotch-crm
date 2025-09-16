import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService } from '../api/googleSheetsService';

export function useLeads(addNotification) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeadsData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setLoading(true);
    const response = await googleSheetsService.fetchLeads();
    console.log('API Response:', response);
    if (response.success) {
      const processedLeads = (response.leads || [])
        .map(lead => ({
          ...lead,
          customerName: lead.customerName || `${lead.firstName||''} ${lead.lastName||''}`.trim() || 'Unknown'
        }))
        .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
      console.log('Processed leads:', processedLeads);
      setLeads(processedLeads);
      if (isManualRefresh) addNotification(`Leads refreshed. Found ${processedLeads.length} leads.`, 'success');
      else addNotification(`Leads loaded. Found ${processedLeads.length} leads.`, 'success');
    } else {
      addNotification(`Error fetching leads: ${response.message}`, 'error');
    }
    if (!isManualRefresh) setLoading(false);
  }, [addNotification]);

  useEffect(() => {
    loadLeadsData();
  }, [loadLeadsData]);

  const addLead = useCallback(async (leadData) => {
    const response = await googleSheetsService.addLead(leadData);
    if (response.success && response.lead) {
      setLeads(prev => [response.lead, ...prev].sort((a,b) => new Date(b.createdDate||0)-new Date(a.createdDate||0)));
      addNotification(`Lead added: ${response.lead.customerName}`, 'success');
    } else {
      addNotification(`Error adding lead: ${response.message}`, 'error');
    }
    return response;
  }, [addNotification]);

  const updateLead = useCallback(async (updatedLead) => {
    const response = await googleSheetsService.updateLead(updatedLead);
    if (response.success && response.lead) {
      setLeads(prev => prev.map(l => (l.id === response.lead.id ? response.lead : l)));
      addNotification(`Lead updated: ${response.lead.customerName}`, 'info');
    } else {
      addNotification(`Error updating lead: ${response.message}`, 'error');
    }
    return response;
  }, [addNotification]);
  
  const deleteLead = useCallback(async (leadId) => {
    const leadToDelete = leads.find(l => l.id === leadId);
    if (!leadToDelete) return;

    if (window.confirm(`Are you sure you want to delete ${leadToDelete.customerName}?`)) {
      const response = await googleSheetsService.deleteLead(leadId);
      if (response.success) {
        setLeads(currentLeads => currentLeads.filter(l => l.id !== leadId));
        addNotification(`Lead deleted: ${leadToDelete.customerName}`, 'warning');
      } else {
        addNotification(`Error deleting lead: ${response.message}`, 'error');
      }
    }
  }, [leads, addNotification]);

  return { leads, loading, refreshLeads: () => loadLeadsData(true), addLead, updateLead, deleteLead };
}