import { supabase } from '../lib/supabase';

// =============================================
// LEADS SERVICE
// Replaces: googleSheetsService.getLeads()
// =============================================
export const leadsService = {
  async getAll(filters = {}) {
    let query = supabase
      .from('leads')
      .select('*')
      .is('deleted_at', null);

    // Apply filters
    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,` +
        `email.ilike.%${filters.search}%,` +
        `phone_number.ilike.%${filters.search}%,` +
        `address.ilike.%${filters.search}%`
      );
    }

    if (filters.quality) {
      query = query.eq('quality', filters.quality);
    }

    if (filters.disposition) {
      query = query.eq('disposition', filters.disposition);
    }

    if (filters.dateFrom) {
      query = query.gte('date_added', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('date_added', filters.dateTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch leads: ${error.message}`);
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch lead: ${error.message}`);
    return data;
  },

  async create(leadData) {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        ...leadData,
        date_added: leadData.date_added || new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update lead: ${error.message}`);
    return data;
  },

  async delete(id) {
    // Soft delete
    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete lead: ${error.message}`);
  },

  // Real-time subscription
  subscribeToChanges(callback) {
    return supabase
      .channel('leads-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, callback)
      .subscribe();
  }
};

// =============================================
// JOB COUNTS SERVICE
// Job counts data is now part of the leads table
// This service queries leads that have job count data (sqft, quote_amount, etc.)
// =============================================
export const jobCountsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .not('sqft', 'is', null)  // Only get leads with job count data
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch job counts: ${error.message}`);
    return data;
  },

  async create(jobCountData) {
    // Job count data is now stored in the leads table
    const { data, error } = await supabase
      .from('leads')
      .insert([jobCountData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create job count: ${error.message}`);
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update job count: ${error.message}`);
    return data;
  },

  async delete(id) {
    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete job count: ${error.message}`);
  }
};

// =============================================
// COMMUNICATIONS SERVICE
// Integrates with Google Voice tracking
// =============================================
export const communicationsService = {
  async getByLeadId(leadId) {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch communications: ${error.message}`);
    return data;
  },

  async create(commData) {
    const { data, error } = await supabase
      .from('communications')
      .insert([commData])
      .select()
      .single();

    if (error) throw new Error(`Failed to log communication: ${error.message}`);
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        leads (customer_name, phone_number)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(`Failed to fetch communications: ${error.message}`);
    return data;
  }
};

// =============================================
// CANVASSING SERVICE
// Supports: Canvassing Tab operations
// =============================================
export const canvassingService = {
  territories: {
    async getAll() {
      const { data, error } = await supabase
        .from('canvassing_territories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw new Error(`Failed to fetch territories: ${error.message}`);
      return data;
    },

    async create(territoryData) {
      const { data, error } = await supabase
        .from('canvassing_territories')
        .insert([territoryData])
        .select()
        .single();

      if (error) throw new Error(`Failed to create territory: ${error.message}`);
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('canvassing_territories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update territory: ${error.message}`);
      return data;
    }
  },

  properties: {
    async getByTerritory(territoryId) {
      const { data, error } = await supabase
        .from('canvassing_properties')
        .select('*')
        .eq('territory_id', territoryId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch properties: ${error.message}`);
      return data;
    },

    async updateStatus(id, status, notes) {
      const { data, error } = await supabase
        .from('canvassing_properties')
        .update({
          status,
          notes,
          last_visited_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update property status: ${error.message}`);
      return data;
    },

    async create(propertyData) {
      const { data, error } = await supabase
        .from('canvassing_properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) throw new Error(`Failed to create property: ${error.message}`);
      return data;
    }
  },

  visits: {
    async create(visitData) {
      const { data, error } = await supabase
        .from('property_visits')
        .insert([visitData])
        .select()
        .single();

      if (error) throw new Error(`Failed to log visit: ${error.message}`);
      return data;
    },

    async getByProperty(propertyId) {
      const { data, error } = await supabase
        .from('property_visits')
        .select('*')
        .eq('property_id', propertyId)
        .order('visit_date', { ascending: false });

      if (error) throw new Error(`Failed to fetch visits: ${error.message}`);
      return data;
    }
  }
};

// =============================================
// PROPERTY DESIGNS SERVICE
// Supports: 360° Designer Tab
// =============================================
export const propertyDesignsService = {
  async getByLeadId(leadId) {
    const { data, error } = await supabase
      .from('property_designs')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch designs: ${error.message}`);
    return data;
  },

  async save(designData) {
    const { data, error } = await supabase
      .from('property_designs')
      .insert([designData])
      .select()
      .single();

    if (error) throw new Error(`Failed to save design: ${error.message}`);
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('property_designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update design: ${error.message}`);
    return data;
  }
};

// =============================================
// CALENDAR EVENTS SERVICE
// Supports: Calendar Tab
// =============================================
export const calendarEventsService = {
  async getAll(startDate, endDate) {
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        leads (customer_name, phone_number, address)
      `);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) throw new Error(`Failed to fetch events: ${error.message}`);
    return data;
  },

  async create(eventData) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create event: ${error.message}`);
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update event: ${error.message}`);
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete event: ${error.message}`);
  }
};

// =============================================
// DASHBOARD STATISTICS
// Replaces: aggregated calculations from sheets
// =============================================
export const dashboardService = {
  async getStats() {
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single();

    if (error) {
      // Fallback to manual calculation if view not available
      return this.calculateStatsManually();
    }

    return data;
  },

  async calculateStatsManually() {
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .is('deleted_at', null);

    // Job counts are now part of the leads table
    const leadsWithJobCounts = leads?.filter(l => l.sqft != null) || [];

    return {
      total_leads: leads?.length || 0,
      hot_leads: leads?.filter(l => l.quality === 'Hot').length || 0,
      quoted_leads: leads?.filter(l => l.disposition === 'Quoted').length || 0,
      total_quote_value: leads?.reduce((sum, l) => sum + (l.dabella_quote || 0), 0) || 0,
      total_job_counts: leadsWithJobCounts.length,
      total_sqft: leadsWithJobCounts.reduce((sum, l) => sum + (l.sqft || 0), 0),
      conversion_rate: leads?.length ?
        ((leads.filter(l => l.disposition === 'Closed Sold').length / leads.length) * 100).toFixed(2) : 0
    };
  }
};
