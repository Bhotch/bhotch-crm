import { useState, useCallback, useEffect } from 'react';
import {
  logCommunication,
  getCommunicationsForLead,
  getRecentCommunications,
  getCommunicationStats,
  deleteCommunication,
  saveToLocalStorage,
  getFromLocalStorage
} from '../services/communicationsService';
import { communicationsService as supabaseCommunicationsService } from '../api/supabaseService';
import { isSupabaseEnabled } from '../lib/supabase';

/**
 * Custom hook for managing communications
 */
export function useCommunications(addNotification) {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const useSupabase = isSupabaseEnabled();

  /**
   * Load communications from local storage on initialization
   */
  const loadFromLocal = useCallback(() => {
    try {
      const localComms = getFromLocalStorage();
      setCommunications(localComms);
      return localComms;
    } catch (error) {
      console.error('Error loading communications from local storage:', error);
      return [];
    }
  }, []);

  // Load communications on mount (only if not using Supabase)
  useEffect(() => {
    if (!useSupabase) {
      loadFromLocal();
    }
  }, [loadFromLocal, useSupabase]);

  /**
   * Add a new communication
   */
  const addCommunication = useCallback(async (communication) => {
    setLoading(true);
    try {
      if (useSupabase) {
        // Use Supabase
        const result = await supabaseCommunicationsService.create({
          lead_id: communication.leadId,
          type: communication.communicationType?.toLowerCase() || 'call',
          direction: communication.direction || 'outbound',
          outcome: communication.status,
          message_content: communication.notes,
          duration_seconds: communication.duration ? parseInt(communication.duration) * 60 : null,
          timestamp: communication.dateTime || new Date().toISOString()
        });

        setCommunications(prev => [...prev, result]);

        if (addNotification) {
          addNotification('Communication logged successfully', 'success');
        }

        return result;
      } else {
        // Try to save to backend
        await logCommunication(communication);

        // Also save to local storage as backup
        const result = saveToLocalStorage(communication);

        // Update state
        setCommunications(prev => [...prev, result.data]);

        if (addNotification) {
          addNotification('Communication logged successfully', 'success');
        }

        return result.data;
      }
    } catch (error) {
      console.error('Error adding communication:', error);

      // Fallback to local storage only
      try {
        const result = saveToLocalStorage(communication);
        setCommunications(prev => [...prev, result.data]);

        if (addNotification) {
          addNotification('Communication saved locally (offline mode)', 'warning');
        }

        return result.data;
      } catch (localError) {
        if (addNotification) {
          addNotification('Failed to save communication', 'error');
        }
        throw localError;
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification, useSupabase]);

  /**
   * Get communications for a specific lead
   */
  const getForLead = useCallback(async (leadId) => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const data = await getCommunicationsForLead(leadId);

      // If backend returns empty, try local storage
      if (!data || data.length === 0) {
        const localComms = getFromLocalStorage();
        const filtered = localComms.filter(comm => comm.leadId === leadId);
        return filtered;
      }

      return data;
    } catch (error) {
      console.error('Error fetching communications for lead:', error);

      // Fallback to local storage
      const localComms = getFromLocalStorage();
      return localComms.filter(comm => comm.leadId === leadId);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get recent communications
   */
  const getRecent = useCallback(async (days = 7) => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const data = await getRecentCommunications(days);

      // If backend returns empty, try local storage
      if (!data || data.length === 0) {
        const localComms = getFromLocalStorage();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const filtered = localComms.filter(comm =>
          new Date(comm.dateTime) >= cutoffDate
        );

        setCommunications(filtered);
        return filtered;
      }

      setCommunications(data);
      return data;
    } catch (error) {
      console.error('Error fetching recent communications:', error);

      // Fallback to local storage
      const localComms = getFromLocalStorage();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filtered = localComms.filter(comm =>
        new Date(comm.dateTime) >= cutoffDate
      );

      setCommunications(filtered);
      return filtered;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get communication statistics
   */
  const getStats = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const data = await getCommunicationStats();

      // If backend returns null, calculate from local storage
      if (!data) {
        const localComms = getFromLocalStorage();
        const calculated = {
          totalCalls: localComms.filter(c => c.communicationType === 'Call').length,
          totalSMS: localComms.filter(c => c.communicationType === 'SMS').length,
          totalEmails: localComms.filter(c => c.communicationType === 'Email').length,
          appointmentsConfirmed: localComms.filter(c => c.status === 'Completed' && c.notes?.includes('confirmed')).length,
          noAnswers: localComms.filter(c => c.status === 'No Answer').length,
          voicemailsLeft: localComms.filter(c => c.status === 'Left Voicemail').length,
        };

        setStats(calculated);
        return calculated;
      }

      setStats(data);
      return data;
    } catch (error) {
      console.error('Error fetching communication stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a communication
   */
  const removeCommunication = useCallback(async (communicationId) => {
    setLoading(true);
    try {
      // Try to delete from backend
      await deleteCommunication(communicationId);

      // Update state
      setCommunications(prev => prev.filter(c => c.id !== communicationId));

      if (addNotification) {
        addNotification('Communication deleted', 'success');
      }
    } catch (error) {
      console.error('Error deleting communication:', error);

      if (addNotification) {
        addNotification('Failed to delete communication', 'error');
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  return {
    communications,
    loading,
    stats,
    addCommunication,
    getForLead,
    getRecent,
    getStats,
    removeCommunication,
    loadFromLocal
  };
}
