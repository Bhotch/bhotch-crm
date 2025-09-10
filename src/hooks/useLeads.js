// Save this as: src/hooks/useLeads.js
// Professional Lead Management Hook with Google Sheets Integration

import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService, activityLogger } from '../services';

export const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch leads from Google Sheets with proper error handling
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching leads from Google Sheets...');
      
      // Call your Google Sheets service
      const result = await googleSheetsService.getLeads();
      console.log('Raw result from Google Sheets:', result);
      
      // Handle different response structures
      let leadsData = [];
      
      if (result) {
        if (result.data) {
          leadsData = result.data;
        } else if (result.leads) {
          leadsData = result.leads;
        } else if (Array.isArray(result)) {
          leadsData = result;
        } else {
          console.warn('Unexpected response structure:', result);
          leadsData = [];
        }
      }
      
      // Ensure it's an array
      const leadsArray = Array.isArray(leadsData) ? leadsData : [];
      
      // Transform the data to ensure all required fields exist
      const transformedLeads = leadsArray.map((lead, index) => ({
        id: lead.id || `LEAD_${index + 1}`,
        customerName: lead.customerName || lead.name || 'Unknown',
        phoneNumber: lead.phoneNumber || lead.phone || '',
        email: lead.email || '',
        address: lead.address || '',
        dabellaQuote: lead.dabellaQuote || lead.quote || 'Pending',
        quality: lead.quality || 'Warm',
        disposition: lead.disposition || lead.status || 'Initial Contact',
        leadSource: lead.leadSource || lead.source || 'Unknown',
        notes: lead.notes || '',
        roofAge: lead.roofAge || '',
        roofType: lead.roofType || '',
        inspectionStatus: lead.inspectionStatus || 'Not Scheduled',
        appointmentDate: lead.appointmentDate || '',
        createdDate: lead.createdDate || new Date().toISOString(),
        lastContact: lead.lastContact || new Date().toISOString(),
        // Additional professional fields
        insuranceCompany: lead.insuranceCompany || '',
        claimNumber: lead.claimNumber || '',
        estimatedSquareFeet: lead.estimatedSquareFeet || '',
        pitch: lead.pitch || ''
      }));
      
      console.log(`Successfully loaded ${transformedLeads.length} leads`);
      setLeads(transformedLeads);
      
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Failed to fetch leads');
      setLeads([]);
      
      // Show user-friendly error
      if (err.message && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to database. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load leads on mount and when refresh is triggered
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshTrigger]);

  // Add a new lead with validation
  const addLead = async (leadData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!leadData.customerName || !leadData.phoneNumber) {
        throw new Error('Customer name and phone number are required');
      }
      
      console.log('Adding new lead:', leadData.customerName);
      
      // Send to Google Sheets
      const result = await googleSheetsService.addLead(leadData);
      
      // Log activity
      await activityLogger.logActivity(
        'LEAD_CREATED',
        result.leadId || leadData.id,
        `New lead created: ${leadData.customerName}`
      );
      
      // Refresh the leads list to get the new lead with its server-generated ID
      setRefreshTrigger(prev => prev + 1);
      
      return { success: true, ...result };
      
    } catch (err) {
      console.error('Error adding lead:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing lead
  const updateLead = async (leadData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!leadData.id) {
        throw new Error('Lead ID is required for updates');
      }
      
      console.log('Updating lead:', leadData.customerName);
      
      // Send update to Google Sheets
      const result = await googleSheetsService.updateLead(leadData);
      
      // Log activity
      await activityLogger.logActivity(
        'LEAD_UPDATED',
        leadData.id,
        `Lead updated: ${leadData.customerName}`
      );
      
      // Update local state optimistically
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadData.id ? { ...lead, ...leadData } : lead
        )
      );
      
      // Refresh from server to ensure sync
      setTimeout(() => setRefreshTrigger(prev => prev + 1), 1000);
      
      return { success: true, ...result };
      
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a lead
  const deleteLead = async (leadId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Find lead name for logging
      const lead = leads.find(l => l.id === leadId);
      const leadName = lead ? lead.customerName : 'Unknown';
      
      console.log('Deleting lead:', leadName);
      
      // Send delete request to Google Sheets
      const result = await googleSheetsService.deleteLead(leadId);
      
      // Log activity
      await activityLogger.logActivity(
        'LEAD_DELETED',
        leadId,
        `Lead deleted: ${leadName}`
      );
      
      // Remove from local state immediately
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
      
      return { success: true, ...result };
      
    } catch (err) {
      console.error('Error deleting lead:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Manually refresh leads from server
  const refreshLeads = () => {
    console.log('Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  // Get filtered leads based on criteria
  const getFilteredLeads = (filters = {}) => {
    return leads.filter(lead => {
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          lead.customerName.toLowerCase().includes(search) ||
          lead.phoneNumber.includes(search) ||
          lead.address.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      if (filters.quality && filters.quality !== 'all') {
        if (lead.quality !== filters.quality) return false;
      }
      
      if (filters.disposition && filters.disposition !== 'all') {
        if (lead.disposition !== filters.disposition) return false;
      }
      
      if (filters.leadSource && filters.leadSource !== 'all') {
        if (lead.leadSource !== filters.leadSource) return false;
      }
      
      return true;
    });
  };

  // Calculate statistics
  const getStats = () => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.quality === 'Hot').length;
    const warmLeads = leads.filter(l => l.quality === 'Warm').length;
    const coldLeads = leads.filter(l => l.quality === 'Cold').length;
    const quotedLeads = leads.filter(l => l.disposition === 'Quoted').length;
    const closedWon = leads.filter(l => l.disposition === 'Closed Won').length;
    
    // Calculate total quote value
    let totalQuoteValue = 0;
    leads.forEach(lead => {
      if (lead.dabellaQuote && lead.dabellaQuote !== 'Pending') {
        const value = parseFloat(lead.dabellaQuote.replace(/[$,]/g, ''));
        if (!isNaN(value)) {
          totalQuoteValue += value;
        }
      }
    });
    
    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;
    
    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      quotedLeads,
      closedWon,
      totalQuoteValue,
      conversionRate: conversionRate.toFixed(1)
    };
  };

  return {
    leads,
    loading,
    error,
    addLead,
    updateLead,
    deleteLead,
    refreshLeads,
    getFilteredLeads,
    getStats
  };
};

// Export other hooks for appointments and notifications
export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const addAppointment = async (appointment) => {
    console.log('Adding appointment:', appointment);
    // Add Google Sheets integration here
    setAppointments(prev => [...prev, { ...appointment, id: Date.now().toString() }]);
  };
  
  return {
    appointments,
    loading,
    addAppointment
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };
  
  return {
    notifications,
    addNotification
  };
};