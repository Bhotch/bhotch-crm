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
        // Use Supabase - Map snake_case to camelCase for frontend
        const data = await leadsService.getAll();

        // DEBUG: Log first lead to see what Supabase returns
        if (data && data.length > 0) {
          console.log('=== SUPABASE RAW DATA ===');
          console.log('First lead from Supabase:', data[0]);
          console.log('Field names:', Object.keys(data[0]));
          console.log('Phone number value:', data[0].phone_number);
          console.log('Quality value:', data[0].quality);
          console.log('Disposition value:', data[0].disposition);
          console.log('Lead source value:', data[0].lead_source);
        }

        const processedLeads = data.map(lead => ({
          // Keep original snake_case fields
          ...lead,
          // Map to camelCase for frontend compatibility
          id: lead.id,
          customerName: lead.customer_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
          firstName: lead.first_name,
          lastName: lead.last_name,
          phoneNumber: lead.phone_number,
          email: lead.email,
          address: lead.address,
          latitude: lead.latitude,
          longitude: lead.longitude,
          dateAdded: lead.date_added,
          quality: lead.quality,
          disposition: lead.disposition,
          leadSource: lead.lead_source,
          status: lead.status,
          roofAge: lead.roof_age,
          roofType: lead.roof_type,
          // Measurements
          sqFt: lead.sqft,
          ridgeLf: lead.ridge_lf,
          valleyLf: lead.valley_lf,
          eavesLf: lead.eaves_lf,
          // Ventilation
          ridgeVents: lead.ridge_vents,
          turbineVents: lead.turbine_vents,
          turbine: lead.turbine_vents, // alias
          rimeFlow: lead.rime_flow,
          // Pipes
          pipes12: lead.pipes_12,
          pipes34: lead.pipes_34,
          pipes1Half: lead.pipes_12, // alias
          pipes2: lead.pipes_12, // alias (assuming pipes_12 covers both)
          pipes3: lead.pipes_34, // alias
          pipes4: lead.pipes_34, // alias (assuming pipes_34 covers both)
          // Features
          gables: lead.gables,
          turtleBacks: lead.turtle_backs,
          satellite: lead.satellite,
          chimney: lead.chimney,
          solar: lead.solar,
          swampCooler: lead.swamp_cooler,
          // Gutters
          guttersLf: lead.gutter_lf,
          gutterLf: lead.gutter_lf, // alias
          downspouts: lead.downspouts,
          gutterGuardLf: lead.gutter_guard_lf,
          // Financial
          dabellaQuote: lead.dabella_quote,
          quoteAmount: lead.quote_amount,
          quoteNotes: lead.quote_notes,
          // Additional
          permanentLighting: lead.permanent_lighting,
          notes: lead.notes,
          // Timestamps
          createdDate: lead.created_at,
          createdAt: lead.created_at,
          updatedAt: lead.updated_at,
          deletedAt: lead.deleted_at
        }));
        setLeads(processedLeads);
        if (isManualRefresh) addNotification(`Leads refreshed from Supabase. Found ${processedLeads.length} leads.`, 'success');
        else addNotification(`Leads loaded from Supabase. Found ${processedLeads.length} leads.`, 'success');
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
      const mapLeadFromSupabase = (lead) => ({
        ...lead,
        customerName: lead.customer_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
        firstName: lead.first_name,
        lastName: lead.last_name,
        phoneNumber: lead.phone_number,
        email: lead.email,
        address: lead.address,
        dateAdded: lead.date_added,
        quality: lead.quality,
        disposition: lead.disposition,
        leadSource: lead.lead_source,
        roofAge: lead.roof_age,
        roofType: lead.roof_type,
        sqFt: lead.sqft,
        ridgeLf: lead.ridge_lf,
        valleyLf: lead.valley_lf,
        eavesLf: lead.eaves_lf,
        ridgeVents: lead.ridge_vents,
        turbineVents: lead.turbine_vents,
        turbine: lead.turbine_vents,
        rimeFlow: lead.rime_flow,
        pipes12: lead.pipes_12,
        pipes34: lead.pipes_34,
        gables: lead.gables,
        turtleBacks: lead.turtle_backs,
        satellite: lead.satellite,
        chimney: lead.chimney,
        solar: lead.solar,
        swampCooler: lead.swamp_cooler,
        guttersLf: lead.gutter_lf,
        gutterLf: lead.gutter_lf,
        downspouts: lead.downspouts,
        gutterGuardLf: lead.gutter_guard_lf,
        dabellaQuote: lead.dabella_quote,
        quoteAmount: lead.quote_amount,
        quoteNotes: lead.quote_notes,
        permanentLighting: lead.permanent_lighting,
        notes: lead.notes,
        createdDate: lead.created_at,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      });

      const subscription = leadsService.subscribeToChanges((payload) => {
        console.log('Lead changed:', payload);

        if (payload.eventType === 'INSERT') {
          setLeads(prev => [mapLeadFromSupabase(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(lead =>
            lead.id === payload.new.id ? mapLeadFromSupabase(payload.new) : lead
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
        // Helper function to convert empty strings to null for numeric fields
        const parseNumeric = (value) => {
          if (value === '' || value === null || value === undefined) return null;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? null : parsed;
        };
        const parseInt = (value) => {
          if (value === '' || value === null || value === undefined) return null;
          const parsed = Number.parseInt(value);
          return isNaN(parsed) ? null : parsed;
        };

        const newLead = await leadsService.create({
          customer_name: leadData.customerName,
          first_name: leadData.firstName || null,
          last_name: leadData.lastName || null,
          phone_number: leadData.phoneNumber,
          email: leadData.email || null,
          address: leadData.address || null,
          quality: leadData.quality,
          disposition: leadData.disposition,
          lead_source: leadData.leadSource || null,
          roof_age: parseInt(leadData.roofAge),
          roof_type: leadData.roofType || null,
          dabella_quote: parseNumeric(leadData.dabellaQuote),
          notes: leadData.notes || null,
          // Job count fields
          sqft: parseNumeric(leadData.sqft),
          ridge_lf: parseNumeric(leadData.ridgeLf),
          valley_lf: parseNumeric(leadData.valleyLf),
          eaves_lf: parseNumeric(leadData.eavesLf),
          ridge_vents: parseInt(leadData.ridgeVents),
          turbine_vents: parseInt(leadData.turbineVents),
          rime_flow: parseNumeric(leadData.rimeFlow),
          pipes_12: parseInt(leadData.pipes12),
          pipes_34: parseInt(leadData.pipes34),
          gables: parseInt(leadData.gables),
          turtle_backs: parseInt(leadData.turtleBacks),
          satellite: leadData.satellite || false,
          chimney: leadData.chimney || false,
          solar: leadData.solar || false,
          swamp_cooler: leadData.swampCooler || false,
          gutter_lf: parseNumeric(leadData.gutterLf),
          downspouts: parseInt(leadData.downspouts),
          gutter_guard_lf: parseNumeric(leadData.gutterGuardLf),
          permanent_lighting: leadData.permanentLighting || null,
          quote_amount: parseNumeric(leadData.quoteAmount),
          quote_notes: leadData.quoteNotes || null
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
        // Helper function to convert empty strings to null for numeric fields
        const parseNumeric = (value) => {
          if (value === '' || value === null || value === undefined) return null;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? null : parsed;
        };
        const parseInt = (value) => {
          if (value === '' || value === null || value === undefined) return null;
          const parsed = Number.parseInt(value);
          return isNaN(parsed) ? null : parsed;
        };

        const updated = await leadsService.update(updatedLead.id, {
          customer_name: updatedLead.customerName,
          first_name: updatedLead.firstName || null,
          last_name: updatedLead.lastName || null,
          phone_number: updatedLead.phoneNumber,
          email: updatedLead.email || null,
          address: updatedLead.address || null,
          quality: updatedLead.quality,
          disposition: updatedLead.disposition,
          roof_age: parseInt(updatedLead.roofAge),
          roof_type: updatedLead.roofType || null,
          dabella_quote: parseNumeric(updatedLead.dabellaQuote),
          notes: updatedLead.notes || null,
          // Job count fields
          sqft: parseNumeric(updatedLead.sqft),
          ridge_lf: parseNumeric(updatedLead.ridgeLf),
          valley_lf: parseNumeric(updatedLead.valleyLf),
          eaves_lf: parseNumeric(updatedLead.eavesLf),
          ridge_vents: parseInt(updatedLead.ridgeVents),
          turbine_vents: parseInt(updatedLead.turbineVents),
          rime_flow: parseNumeric(updatedLead.rimeFlow),
          pipes_12: parseInt(updatedLead.pipes12),
          pipes_34: parseInt(updatedLead.pipes34),
          gables: parseInt(updatedLead.gables),
          turtle_backs: parseInt(updatedLead.turtleBacks),
          satellite: updatedLead.satellite || false,
          chimney: updatedLead.chimney || false,
          solar: updatedLead.solar || false,
          swamp_cooler: updatedLead.swampCooler || false,
          gutter_lf: parseNumeric(updatedLead.gutterLf),
          downspouts: parseInt(updatedLead.downspouts),
          gutter_guard_lf: parseNumeric(updatedLead.gutterGuardLf),
          permanent_lighting: updatedLead.permanentLighting || null,
          quote_amount: parseNumeric(updatedLead.quoteAmount),
          quote_notes: updatedLead.quoteNotes || null
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