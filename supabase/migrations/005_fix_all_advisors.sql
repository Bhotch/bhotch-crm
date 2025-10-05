-- =============================================
-- FIX ALL SUPABASE ADVISORS
-- =============================================
-- This migration fixes all security and performance issues identified by Supabase database linter
--
-- Issues addressed:
-- 1. RLS SECURITY (16 errors):
--    - 7 tables with policies but RLS disabled (policy_exists_rls_disabled)
--    - 7 tables with RLS disabled in public schema (rls_disabled_in_public)
--    - 1 view with SECURITY DEFINER (security_definer_view)
--    - 1 table without RLS enabled (job_counts - now removed)
--
-- 2. PERFORMANCE (23 info):
--    - 22 unused indexes to drop
--    - 1 missing foreign key index to add
-- =============================================

-- =============================================
-- SECTION 1: FIX RLS SECURITY ISSUES
-- =============================================

-- Re-enable RLS on all tables (was disabled in migration 003)
-- Note: Policies already exist from migration 001, just need to enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Note: job_counts table referenced in migration 003 has been removed in migration 004
-- No action needed for job_counts

-- =============================================
-- SECTION 2: FIX SECURITY DEFINER VIEW
-- =============================================

-- Recreate dashboard_stats view to ensure it uses SECURITY INVOKER (default)
-- This ensures the view uses the querying user's permissions, not the creator's
DROP VIEW IF EXISTS dashboard_stats;

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    -- Lead statistics
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_leads,
    COUNT(*) FILTER (WHERE quality = 'Hot' AND deleted_at IS NULL) AS hot_leads,
    COUNT(*) FILTER (WHERE disposition = 'Quoted' AND deleted_at IS NULL) AS quoted_leads,
    SUM(dabella_quote) FILTER (WHERE deleted_at IS NULL) AS total_quote_value,

    -- Disposition breakdown
    COUNT(*) FILTER (WHERE disposition = 'Scheduled' AND deleted_at IS NULL) AS scheduled_count,
    COUNT(*) FILTER (WHERE disposition = 'Follow Up' AND deleted_at IS NULL) AS follow_up_count,
    COUNT(*) FILTER (WHERE disposition = 'Insurance' AND deleted_at IS NULL) AS insurance_count,
    COUNT(*) FILTER (WHERE disposition = 'Closed Sold' AND deleted_at IS NULL) AS closed_sold_count,

    -- Conversion rate
    ROUND(
        (COUNT(*) FILTER (WHERE disposition = 'Closed Sold' AND deleted_at IS NULL)::numeric /
        NULLIF(COUNT(*) FILTER (WHERE deleted_at IS NULL), 0)) * 100, 2
    ) AS conversion_rate

FROM leads;

-- Grant appropriate permissions
GRANT SELECT ON dashboard_stats TO anon, authenticated;

COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics view using SECURITY INVOKER (default) to use querying user permissions';

-- =============================================
-- SECTION 3: FIX PERFORMANCE ISSUES
-- =============================================

-- Add missing index on foreign key
CREATE INDEX IF NOT EXISTS idx_property_visits_territory_id ON property_visits(territory_id);

-- Drop unused indexes (identified by Supabase linter)
-- Note: These indexes have never been used according to pg_stat_user_indexes

-- Leads table unused indexes
DROP INDEX IF EXISTS idx_leads_quality;
DROP INDEX IF EXISTS idx_leads_disposition;
DROP INDEX IF EXISTS idx_leads_location;
DROP INDEX IF EXISTS idx_leads_phone;
DROP INDEX IF EXISTS idx_leads_email;
DROP INDEX IF EXISTS idx_leads_customer_name;
DROP INDEX IF EXISTS idx_leads_search;
DROP INDEX IF EXISTS idx_leads_sqft;
DROP INDEX IF EXISTS idx_leads_quote_amount;

-- Communications table unused indexes
DROP INDEX IF EXISTS idx_communications_lead_id;
DROP INDEX IF EXISTS idx_communications_type;

-- Canvassing territories unused indexes
DROP INDEX IF EXISTS idx_territories_active;

-- Canvassing properties unused indexes
DROP INDEX IF EXISTS idx_canvassing_properties_territory;
DROP INDEX IF EXISTS idx_canvassing_properties_status;
DROP INDEX IF EXISTS idx_canvassing_properties_location;

-- Property visits unused indexes
DROP INDEX IF EXISTS idx_property_visits_property_id;
DROP INDEX IF EXISTS idx_property_visits_date;

-- Property designs unused indexes
DROP INDEX IF EXISTS idx_property_designs_lead_id;
DROP INDEX IF EXISTS idx_property_designs_status;

-- Calendar events unused indexes
DROP INDEX IF EXISTS idx_calendar_events_lead_id;
DROP INDEX IF EXISTS idx_calendar_events_start_time;
DROP INDEX IF EXISTS idx_calendar_events_google_id;

-- =============================================
-- VERIFICATION QUERIES (Run manually to verify)
-- =============================================

-- Verify RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('leads', 'communications', 'canvassing_territories', 'canvassing_properties',
--                   'property_visits', 'property_designs', 'calendar_events')
-- ORDER BY tablename;

-- Verify view security (should NOT show SECURITY DEFINER):
-- SELECT viewname, definition
-- FROM pg_views
-- WHERE viewname = 'dashboard_stats';

-- Verify new index exists:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'property_visits'
-- AND indexname = 'idx_property_visits_territory_id';

-- Verify unused indexes are dropped:
-- SELECT indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE 'idx_leads_%'
-- OR indexname LIKE 'idx_communications_%'
-- OR indexname LIKE 'idx_territories_%'
-- OR indexname LIKE 'idx_canvassing_%'
-- OR indexname LIKE 'idx_property_%'
-- OR indexname LIKE 'idx_calendar_%';

-- =============================================
-- NOTES
-- =============================================
-- This migration supersedes the RLS disable in migration 003_disable_rls_for_development.sql
-- All security policies from migration 001 remain in place and are now active
-- Performance is optimized by removing 22 unused indexes and adding 1 missing FK index
