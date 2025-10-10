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

        const processedLeads = data.map(lead => ({
          // Only use camelCase for frontend - NO duplicate snake_case fields
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
          rimeFlow: lead.rime_flow,
          // Pipes
          pipes12: lead.pipes_12,
          pipes34: lead.pipes_34,
          pipe1Half: lead.pipe_1_5_inch,
          pipe2: lead.pipe_2_inch,
          pipe3: lead.pipe_3_inch,
          pipe4: lead.pipe_4_inch,
          // Features
          gables: lead.gables,
          turtleBacks: lead.turtle_backs,
          satellite: lead.satellite,
          chimney: lead.chimney,
          solar: lead.solar,
          swampCooler: lead.swamp_cooler,
          // Gutters
          gutterLf: lead.gutter_lf,
          downspouts: lead.downspouts,
          gutterGuardLf: lead.gutter_guard_lf,
          // Financial
          dabellaQuote: lead.dabella_quote,
          quoteAmount: lead.quote_amount,
          quoteNotes: lead.quote_notes,
          // Additional
          permanentLighting: lead.permanent_lighting,
          notes: lead.notes,
          lastContactDate: lead.last_contact_date,
          // Timestamps
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
        sqFt: lead.sqft,
        ridgeLf: lead.ridge_lf,
        valleyLf: lead.valley_lf,
        eavesLf: lead.eaves_lf,
        ridgeVents: lead.ridge_vents,
        turbineVents: lead.turbine_vents,
        rimeFlow: lead.rime_flow,
        pipes12: lead.pipes_12,
        pipes34: lead.pipes_34,
        pipe1Half: lead.pipe_1_5_inch,
        pipe2: lead.pipe_2_inch,
        pipe3: lead.pipe_3_inch,
        pipe4: lead.pipe_4_inch,
        gables: lead.gables,
        turtleBacks: lead.turtle_backs,
        satellite: lead.satellite,
        chimney: lead.chimney,
        solar: lead.solar,
        swampCooler: lead.swamp_cooler,
        gutterLf: lead.gutter_lf,
        downspouts: lead.downspouts,
        gutterGuardLf: lead.gutter_guard_lf,
        dabellaQuote: lead.dabella_quote,
        quoteAmount: lead.quote_amount,
        quoteNotes: lead.quote_notes,
        permanentLighting: lead.permanent_lighting,
        notes: lead.notes,
        lastContactDate: lead.last_contact_date,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
        deletedAt: lead.deleted_at
      });

      const subscription = leadsService.subscribeToChanges((payload) => {
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
          latitude: leadData.latitude || null,
          longitude: leadData.longitude || null,
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

        // Map to camelCase for frontend
        const mappedLead = {
          id: newLead.id,
          customerName: newLead.customer_name || `${newLead.first_name || ''} ${newLead.last_name || ''}`.trim() || 'Unknown',
          firstName: newLead.first_name,
          lastName: newLead.last_name,
          phoneNumber: newLead.phone_number,
          email: newLead.email,
          address: newLead.address,
          latitude: newLead.latitude,
          longitude: newLead.longitude,
          dateAdded: newLead.date_added,
          quality: newLead.quality,
          disposition: newLead.disposition,
          leadSource: newLead.lead_source,
          status: newLead.status,
          roofAge: newLead.roof_age,
          roofType: newLead.roof_type,
          sqFt: newLead.sqft,
          ridgeLf: newLead.ridge_lf,
          valleyLf: newLead.valley_lf,
          eavesLf: newLead.eaves_lf,
          ridgeVents: newLead.ridge_vents,
          turbineVents: newLead.turbine_vents,
          rimeFlow: newLead.rime_flow,
          pipes12: newLead.pipes_12,
          pipes34: newLead.pipes_34,
          pipe1Half: newLead.pipe_1_5_inch,
          pipe2: newLead.pipe_2_inch,
          pipe3: newLead.pipe_3_inch,
          pipe4: newLead.pipe_4_inch,
          gables: newLead.gables,
          turtleBacks: newLead.turtle_backs,
          satellite: newLead.satellite,
          chimney: newLead.chimney,
          solar: newLead.solar,
          swampCooler: newLead.swamp_cooler,
          gutterLf: newLead.gutter_lf,
          downspouts: newLead.downspouts,
          gutterGuardLf: newLead.gutter_guard_lf,
          dabellaQuote: newLead.dabella_quote,
          quoteAmount: newLead.quote_amount,
          quoteNotes: newLead.quote_notes,
          permanentLighting: newLead.permanent_lighting,
          notes: newLead.notes,
          lastContactDate: newLead.last_contact_date,
          createdAt: newLead.created_at,
          updatedAt: newLead.updated_at,
          deletedAt: newLead.deleted_at
        };

        // Immediately update local state to show the new lead in the UI
        setLeads(prev => [mappedLead, ...prev]);
        addNotification(`Lead added: ${mappedLead.customerName}`, 'success');
        return { success: true, lead: mappedLead };
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
          latitude: updatedLead.latitude || null,
          longitude: updatedLead.longitude || null,
          quality: updatedLead.quality,
          disposition: updatedLead.disposition,
          lead_source: updatedLead.leadSource || null,
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

        // Map to camelCase for frontend
        const mappedLead = {
          id: updated.id,
          customerName: updated.customer_name || `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'Unknown',
          firstName: updated.first_name,
          lastName: updated.last_name,
          phoneNumber: updated.phone_number,
          email: updated.email,
          address: updated.address,
          latitude: updated.latitude,
          longitude: updated.longitude,
          dateAdded: updated.date_added,
          quality: updated.quality,
          disposition: updated.disposition,
          leadSource: updated.lead_source,
          status: updated.status,
          roofAge: updated.roof_age,
          roofType: updated.roof_type,
          sqFt: updated.sqft,
          ridgeLf: updated.ridge_lf,
          valleyLf: updated.valley_lf,
          eavesLf: updated.eaves_lf,
          ridgeVents: updated.ridge_vents,
          turbineVents: updated.turbine_vents,
          rimeFlow: updated.rime_flow,
          pipes12: updated.pipes_12,
          pipes34: updated.pipes_34,
          pipe1Half: updated.pipe_1_5_inch,
          pipe2: updated.pipe_2_inch,
          pipe3: updated.pipe_3_inch,
          pipe4: updated.pipe_4_inch,
          gables: updated.gables,
          turtleBacks: updated.turtle_backs,
          satellite: updated.satellite,
          chimney: updated.chimney,
          solar: updated.solar,
          swampCooler: updated.swamp_cooler,
          gutterLf: updated.gutter_lf,
          downspouts: updated.downspouts,
          gutterGuardLf: updated.gutter_guard_lf,
          dabellaQuote: updated.dabella_quote,
          quoteAmount: updated.quote_amount,
          quoteNotes: updated.quote_notes,
          permanentLighting: updated.permanent_lighting,
          notes: updated.notes,
          lastContactDate: updated.last_contact_date,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          deletedAt: updated.deleted_at
        };

        // Immediately update local state to show the updated lead in the UI
        setLeads(prev => prev.map(l => (l.id === mappedLead.id ? mappedLead : l)));
        addNotification(`Lead updated: ${mappedLead.customerName}`, 'info');
        return { success: true, lead: mappedLead };
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