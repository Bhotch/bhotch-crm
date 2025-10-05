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
import { supabase, isSupabaseEnabled } from '../lib/supabase';

/**
 * Custom hook for managing communications with Supabase support
 * Features:
 * - Dual-mode: Supabase (primary) + Google Sheets/localStorage (fallback)
 * - Real-time subscriptions for live updates
 * - Automatic column name mapping
 * - Comprehensive error handling
 */
export function useCommunications(addNotification) {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const useSupabase = isSupabaseEnabled();

  /**
   * Map Supabase communication to frontend format
   */
  const mapSupabaseToCommunication = useCallback((comm) => ({
    id: comm.id,
    leadId: comm.lead_id,
    communicationType: comm.type?.charAt(0).toUpperCase() + comm.type?.slice(1),
    direction: comm.direction,
    status: comm.outcome,
    notes: comm.message_content,
    duration: comm.duration_seconds ? Math.round(comm.duration_seconds / 60) : null,
    dateTime: comm.timestamp,
    customerName: comm.leads?.customer_name
  }), []);

  /**
   * Load communications from local storage
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

  /**
   * Load all communications from Supabase
   */
  const loadAllCommunications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseCommunicationsService.getAll();
      const mapped = data.map(mapSupabaseToCommunication);
      setCommunications(mapped);
      return mapped;
    } catch (error) {
      console.error('Error loading communications from Supabase:', error);
      // Fallback to local storage
      loadFromLocal();
    } finally {
      setLoading(false);
    }
  }, [loadFromLocal, mapSupabaseToCommunication]);

  /**
   * Load communications on mount
   */
  useEffect(() => {
    if (useSupabase) {
      loadAllCommunications();
    } else {
      loadFromLocal();
    }
  }, [useSupabase, loadAllCommunications, loadFromLocal]);

  /**
   * Set up real-time subscriptions for Supabase
   */
  useEffect(() => {
    if (useSupabase) {
      const subscription = supabase
        .channel('communications-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'communications'
        }, (payload) => {
          console.log('Communication changed:', payload);

          if (payload.eventType === 'INSERT') {
            const newComm = mapSupabaseToCommunication(payload.new);
            setCommunications(prev => [newComm, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCommunications(prev => prev.map(comm =>
              comm.id === payload.new.id ? mapSupabaseToCommunication(payload.new) : comm
            ));
          } else if (payload.eventType === 'DELETE') {
            setCommunications(prev => prev.filter(comm => comm.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [useSupabase, mapSupabaseToCommunication]);

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

        const mapped = mapSupabaseToCommunication(result);
        setCommunications(prev => [mapped, ...prev]);

        if (addNotification) {
          addNotification('Communication logged successfully', 'success');
        }

        return mapped;
      } else {
        // Try to save to backend
        await logCommunication(communication);

        // Also save to local storage as backup
        const result = saveToLocalStorage(communication);

        // Update state
        setCommunications(prev => [result.data, ...prev]);

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
        setCommunications(prev => [result.data, ...prev]);

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
  }, [addNotification, useSupabase, mapSupabaseToCommunication]);

  /**
   * Get communications for a specific lead
   */
  const getForLead = useCallback(async (leadId) => {
    setLoading(true);
    try {
      if (useSupabase) {
        const data = await supabaseCommunicationsService.getByLeadId(leadId);
        const mapped = data.map(mapSupabaseToCommunication);
        return mapped;
      } else {
        // Try to fetch from backend
        try {
          const data = await getCommunicationsForLead(leadId);
          if (!data || data.length === 0) {
            const localComms = getFromLocalStorage();
            return localComms.filter(comm => comm.leadId === leadId);
          }
          return data;
        } catch (error) {
          const localComms = getFromLocalStorage();
          return localComms.filter(comm => comm.leadId === leadId);
        }
      }
    } catch (error) {
      console.error('Error fetching communications for lead:', error);
      const localComms = getFromLocalStorage();
      return localComms.filter(comm => comm.leadId === leadId);
    } finally {
      setLoading(false);
    }
  }, [useSupabase, mapSupabaseToCommunication]);

  /**
   * Get recent communications
   */
  const getRecent = useCallback(async (days = 7) => {
    setLoading(true);
    try {
      if (useSupabase) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const data = await supabaseCommunicationsService.getAll();
        const filtered = data
          .filter(comm => new Date(comm.timestamp) >= cutoffDate)
          .map(mapSupabaseToCommunication);

        setCommunications(filtered);
        return filtered;
      } else {
        // Try to fetch from backend
        try {
          const data = await getRecentCommunications(days);
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
          const localComms = getFromLocalStorage();
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          const filtered = localComms.filter(comm =>
            new Date(comm.dateTime) >= cutoffDate
          );
          setCommunications(filtered);
          return filtered;
        }
      }
    } catch (error) {
      console.error('Error fetching recent communications:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [useSupabase, mapSupabaseToCommunication]);

  /**
   * Get communication statistics
   */
  const getStats = useCallback(async () => {
    setLoading(true);
    try {
      if (useSupabase) {
        const data = await supabaseCommunicationsService.getAll();
        const calculated = {
          totalCalls: data.filter(c => c.type === 'call').length,
          totalSMS: data.filter(c => c.type === 'sms').length,
          totalEmails: data.filter(c => c.type === 'email').length,
          appointmentsConfirmed: data.filter(c =>
            c.outcome === 'Completed' || c.message_content?.includes('confirmed')
          ).length,
          noAnswers: data.filter(c => c.outcome === 'No Answer').length,
          voicemailsLeft: data.filter(c => c.outcome === 'Left Voicemail').length,
        };
        setStats(calculated);
        return calculated;
      } else {
        // Try to fetch from backend
        try {
          const data = await getCommunicationStats();
          if (!data) {
            const localComms = getFromLocalStorage();
            const calculated = {
              totalCalls: localComms.filter(c => c.communicationType === 'Call').length,
              totalSMS: localComms.filter(c => c.communicationType === 'SMS').length,
              totalEmails: localComms.filter(c => c.communicationType === 'Email').length,
              appointmentsConfirmed: localComms.filter(c =>
                c.status === 'Completed' && c.notes?.includes('confirmed')
              ).length,
              noAnswers: localComms.filter(c => c.status === 'No Answer').length,
              voicemailsLeft: localComms.filter(c => c.status === 'Left Voicemail').length,
            };
            setStats(calculated);
            return calculated;
          }
          setStats(data);
          return data;
        } catch (error) {
          const localComms = getFromLocalStorage();
          const calculated = {
            totalCalls: localComms.filter(c => c.communicationType === 'Call').length,
            totalSMS: localComms.filter(c => c.communicationType === 'SMS').length,
            totalEmails: localComms.filter(c => c.communicationType === 'Email').length,
            appointmentsConfirmed: localComms.filter(c =>
              c.status === 'Completed' && c.notes?.includes('confirmed')
            ).length,
            noAnswers: localComms.filter(c => c.status === 'No Answer').length,
            voicemailsLeft: localComms.filter(c => c.status === 'Left Voicemail').length,
          };
          setStats(calculated);
          return calculated;
        }
      }
    } catch (error) {
      console.error('Error fetching communication stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [useSupabase]);

  /**
   * Delete a communication
   */
  const removeCommunication = useCallback(async (communicationId) => {
    setLoading(true);
    try {
      if (useSupabase) {
        // Supabase delete
        const { error } = await supabase
          .from('communications')
          .delete()
          .eq('id', communicationId);

        if (error) throw error;

        setCommunications(prev => prev.filter(c => c.id !== communicationId));
        if (addNotification) {
          addNotification('Communication deleted', 'success');
        }
      } else {
        // Fallback to backend
        await deleteCommunication(communicationId);
        setCommunications(prev => prev.filter(c => c.id !== communicationId));
        if (addNotification) {
          addNotification('Communication deleted', 'success');
        }
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
  }, [addNotification, useSupabase]);

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
