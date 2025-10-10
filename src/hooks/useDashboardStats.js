import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../api/supabaseService';
import { isSupabaseEnabled } from '../lib/supabase';

/**
 * Custom hook for dashboard statistics
 * Supports both Supabase and local calculation
 */
export function useDashboardStats(leads = [], jobCounts = []) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const useSupabase = isSupabaseEnabled();

  const calculateLocalStats = useCallback(() => {
    return {
      totalLeads: leads.length,
      hotLeads: leads.filter(l => l.quality === 'Hot').length,
      quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
      totalQuoteValue: leads.reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote || lead.dabella_quote || '').replace(/[$,]/g, '')) || 0), 0),
      totalJobCounts: jobCounts.length,
      totalSqFt: jobCounts.reduce((sum, jc) => sum + (parseFloat(jc.sqFt || jc.sqft || 0) || 0), 0),
    };
  }, [leads, jobCounts]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      if (useSupabase) {
        // Use Supabase dashboard service
        const supabaseStats = await dashboardService.getStats();
        setStats({
          totalLeads: supabaseStats.total_leads || 0,
          hotLeads: supabaseStats.hot_leads || 0,
          quotedLeads: supabaseStats.quoted_leads || 0,
          totalQuoteValue: supabaseStats.total_quote_value || 0,
          totalJobCounts: supabaseStats.total_job_counts || 0,
          totalSqFt: supabaseStats.total_sqft || 0,
          conversionRate: supabaseStats.conversion_rate || 0
        });
      } else {
        // Calculate from local data
        setStats(calculateLocalStats());
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Fallback to local calculation
      setStats(calculateLocalStats());
    } finally {
      setLoading(false);
    }
  }, [useSupabase, calculateLocalStats]);

  // Initial load
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up automatic refresh for Supabase with optimized performance
  useEffect(() => {
    if (useSupabase) {
      // Use requestIdleCallback for non-blocking updates
      const interval = setInterval(() => {
        // Schedule the update during idle time to avoid blocking the main thread
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            dashboardService.getStats().then(supabaseStats => {
              setStats({
                totalLeads: supabaseStats.total_leads || 0,
                hotLeads: supabaseStats.hot_leads || 0,
                quotedLeads: supabaseStats.quoted_leads || 0,
                totalQuoteValue: supabaseStats.total_quote_value || 0,
                totalJobCounts: supabaseStats.total_job_counts || 0,
                totalSqFt: supabaseStats.total_sqft || 0,
                conversionRate: supabaseStats.conversion_rate || 0
              });
            }).catch(error => {
              console.error('Error refreshing dashboard stats:', error);
            });
          }, { timeout: 2000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            dashboardService.getStats().then(supabaseStats => {
              setStats({
                totalLeads: supabaseStats.total_leads || 0,
                hotLeads: supabaseStats.hot_leads || 0,
                quotedLeads: supabaseStats.quoted_leads || 0,
                totalQuoteValue: supabaseStats.total_quote_value || 0,
                totalJobCounts: supabaseStats.total_job_counts || 0,
                totalSqFt: supabaseStats.total_sqft || 0,
                conversionRate: supabaseStats.conversion_rate || 0
              });
            }).catch(error => {
              console.error('Error refreshing dashboard stats:', error);
            });
          }, 0);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [useSupabase]);

  // Re-calculate when leads or jobCounts change (for non-Supabase mode)
  useEffect(() => {
    if (!useSupabase && leads.length > 0) {
      setStats(calculateLocalStats());
    }
  }, [leads, jobCounts, useSupabase, calculateLocalStats]);

  return {
    stats: stats || {
      totalLeads: 0,
      hotLeads: 0,
      quotedLeads: 0,
      totalQuoteValue: 0,
      totalJobCounts: 0,
      totalSqFt: 0
    },
    loading,
    refreshStats: loadStats
  };
}
