import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService } from '../api/googleSheetsService';
import { leadsService } from '../api/supabaseService';
import { isSupabaseEnabled } from '../lib/supabase';

export function useLeads(addNotification) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const useSupabase = isSupabaseEnabled();

  const loadLeadsData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setLoading(true);

    try {
      if (useSupabase) {
        // Use Supabase
        const data = await leadsService.getAll();
        const processedLeads = data.map(lead => ({
          ...lead,
          customerName: lead.customer_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
          createdDate: lead.created_at
        }));
        setLeads(processedLeads);
        if (isManualRefresh) addNotification(`Leads refreshed. Found ${processedLeads.length} leads.`, 'success');
        else addNotification(`Leads loaded. Found ${processedLeads.length} leads.`, 'success');
      } else {
        // Fallback to Google Sheets
        const response = await googleSheetsService.fetchLeads();
        if (response.success) {
          const processedLeads = (response.data || response.leads || [])
            .map(lead => ({
              ...lead,
              customerName: lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'
            }))
            .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
          setLeads(processedLeads);
          if (isManualRefresh) addNotification(`Leads refreshed. Found ${processedLeads.length} leads.`, 'success');
          else addNotification(`Leads loaded. Found ${processedLeads.length} leads.`, 'success');
        } else {
          addNotification(`Error fetching leads: ${response.message}`, 'error');
        }
      }
    } catch (error) {
      addNotification(`Error loading leads: ${error.message}`, 'error');
    } finally {
      if (!isManualRefresh) setLoading(false);
    }
  }, [addNotification, useSupabase]);

  useEffect(() => {
    loadLeadsData();

    // Set up real-time subscription if using Supabase
    if (useSupabase) {
      const subscription = leadsService.subscribeToChanges((payload) => {
        console.log('Lead changed:', payload);

        if (payload.eventType === 'INSERT') {
          const newLead = {
            ...payload.new,
            customerName: payload.new.customer_name
          };
          setLeads(prev => [newLead, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(lead =>
            lead.id === payload.new.id ? { ...payload.new, customerName: payload.new.customer_name } : lead
          ));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadLeadsData, useSupabase]);

  const addLead = useCallback(async (leadData) => {
    try {
      if (useSupabase) {
        const newLead = await leadsService.create({
          customer_name: leadData.customerName,
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          phone_number: leadData.phoneNumber,
          email: leadData.email,
          address: leadData.address,
          quality: leadData.quality,
          disposition: leadData.disposition,
          lead_source: leadData.leadSource,
          roof_age: leadData.roofAge,
          roof_type: leadData.roofType,
          dabella_quote: leadData.dabellaQuote,
          notes: leadData.notes,
          // Job count fields
          sqft: leadData.sqft,
          ridge_lf: leadData.ridgeLf,
          valley_lf: leadData.valleyLf,
          eaves_lf: leadData.eavesLf,
          ridge_vents: leadData.ridgeVents,
          turbine_vents: leadData.turbineVents,
          rime_flow: leadData.rimeFlow,
          pipe_1_5_inch: leadData.pipe15Inch,
          pipe_2_inch: leadData.pipe2Inch,
          pipe_3_inch: leadData.pipe3Inch,
          pipe_4_inch: leadData.pipe4Inch,
          gables: leadData.gables,
          turtle_backs: leadData.turtleBacks,
          satellite: leadData.satellite,
          chimney: leadData.chimney,
          solar: leadData.solar,
          swamp_cooler: leadData.swampCooler,
          gutter_lf: leadData.gutterLf,
          downspouts: leadData.downspouts,
          gutter_guard_lf: leadData.gutterGuardLf,
          permanent_lighting: leadData.permanentLighting,
          quote_amount: leadData.quoteAmount,
          quote_notes: leadData.quoteNotes
        });
        addNotification(`Lead added: ${newLead.customer_name}`, 'success');
        return { success: true, lead: { ...newLead, customerName: newLead.customer_name } };
      } else {
        const response = await googleSheetsService.addLead(leadData);
        if (response.success && response.lead) {
          setLeads(prev => [response.lead, ...prev].sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0)));
          addNotification(`Lead added: ${response.lead.customerName}`, 'success');
        } else {
          addNotification(`Error adding lead: ${response.message}`, 'error');
        }
        return response;
      }
    } catch (error) {
      addNotification(`Error adding lead: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  }, [addNotification, useSupabase]);

  const updateLead = useCallback(async (updatedLead) => {
    try {
      if (useSupabase) {
        const updated = await leadsService.update(updatedLead.id, {
          customer_name: updatedLead.customerName,
          first_name: updatedLead.firstName,
          last_name: updatedLead.lastName,
          phone_number: updatedLead.phoneNumber,
          email: updatedLead.email,
          address: updatedLead.address,
          quality: updatedLead.quality,
          disposition: updatedLead.disposition,
          dabella_quote: updatedLead.dabellaQuote,
          notes: updatedLead.notes,
          // Job count fields
          sqft: updatedLead.sqft,
          ridge_lf: updatedLead.ridgeLf,
          valley_lf: updatedLead.valleyLf,
          eaves_lf: updatedLead.eavesLf,
          ridge_vents: updatedLead.ridgeVents,
          turbine_vents: updatedLead.turbineVents,
          rime_flow: updatedLead.rimeFlow,
          pipe_1_5_inch: updatedLead.pipe15Inch,
          pipe_2_inch: updatedLead.pipe2Inch,
          pipe_3_inch: updatedLead.pipe3Inch,
          pipe_4_inch: updatedLead.pipe4Inch,
          gables: updatedLead.gables,
          turtle_backs: updatedLead.turtleBacks,
          satellite: updatedLead.satellite,
          chimney: updatedLead.chimney,
          solar: updatedLead.solar,
          swamp_cooler: updatedLead.swampCooler,
          gutter_lf: updatedLead.gutterLf,
          downspouts: updatedLead.downspouts,
          gutter_guard_lf: updatedLead.gutterGuardLf,
          permanent_lighting: updatedLead.permanentLighting,
          quote_amount: updatedLead.quoteAmount,
          quote_notes: updatedLead.quoteNotes
        });
        addNotification(`Lead updated: ${updated.customer_name}`, 'info');
        return { success: true, lead: { ...updated, customerName: updated.customer_name } };
      } else {
        const response = await googleSheetsService.updateLead(updatedLead);
        if (response.success && response.lead) {
          setLeads(prev => prev.map(l => (l.id === response.lead.id ? response.lead : l)));
          addNotification(`Lead updated: ${response.lead.customerName}`, 'info');
        } else {
          addNotification(`Error updating lead: ${response.message}`, 'error');
        }
        return response;
      }
    } catch (error) {
      addNotification(`Error updating lead: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  }, [addNotification, useSupabase]);

  const deleteLead = useCallback(async (leadId) => {
    const leadToDelete = leads.find(l => l.id === leadId);
    if (!leadToDelete) return;

    if (window.confirm(`Are you sure you want to delete ${leadToDelete.customerName}?`)) {
      try {
        if (useSupabase) {
          await leadsService.delete(leadId);
          addNotification(`Lead deleted: ${leadToDelete.customerName}`, 'warning');
        } else {
          const response = await googleSheetsService.deleteLead(leadId);
          if (response.success) {
            setLeads(currentLeads => currentLeads.filter(l => l.id !== leadId));
            addNotification(`Lead deleted: ${leadToDelete.customerName}`, 'warning');
          } else {
            addNotification(`Error deleting lead: ${response.message}`, 'error');
          }
        }
      } catch (error) {
        addNotification(`Error deleting lead: ${error.message}`, 'error');
      }
    }
  }, [leads, addNotification, useSupabase]);

  return { leads, loading, refreshLeads: () => loadLeadsData(true), addLead, updateLead, deleteLead };
}