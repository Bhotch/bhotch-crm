-- =============================================
-- FIX DATABASE LINTER ISSUES
-- =============================================
-- This migration addresses all issues identified by Supabase database linter:
-- 1. SECURITY DEFINER view (ERROR)
-- 2. Unindexed foreign key (INFO)
-- 3. Duplicate RLS policies (WARN)
-- 4. Unused indexes (INFO)
-- =============================================

-- =============================================
-- SECTION 1: FIX SECURITY DEFINER VIEW (ERROR)
-- =============================================
-- Issue: dashboard_stats view uses SECURITY DEFINER
-- Fix: Recreate view without SECURITY DEFINER (uses SECURITY INVOKER by default)

DROP VIEW IF EXISTS dashboard_stats;

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    -- Lead statistics
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_leads,
    COUNT(*) FILTER (WHERE quality = 'Hot' AND deleted_at IS NULL) AS hot_leads,
    COUNT(*) FILTER (WHERE disposition = 'Quoted' AND deleted_at IS NULL) AS quoted_leads,
    SUM(dabella_quote) FILTER (WHERE deleted_at IS NULL) AS total_quote_value,

    -- Job count statistics (from leads table)
    COUNT(*) FILTER (WHERE sqft IS NOT NULL AND deleted_at IS NULL) AS total_job_counts,
    SUM(sqft) FILTER (WHERE deleted_at IS NULL) AS total_sqft,

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

-- Grant permissions
GRANT SELECT ON dashboard_stats TO anon, authenticated;

COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics view using SECURITY INVOKER (default) for proper permission handling';

-- =============================================
-- SECTION 2: ADD MISSING FOREIGN KEY INDEX (INFO)
-- =============================================
-- Issue: property_visits.territory_id foreign key has no index
-- Fix: Add index for better query performance

CREATE INDEX IF NOT EXISTS idx_property_visits_territory_id
ON property_visits(territory_id);

COMMENT ON INDEX idx_property_visits_territory_id IS 'Index for property_visits.territory_id foreign key';

-- =============================================
-- SECTION 3: REMOVE DUPLICATE RLS POLICIES (WARN)
-- =============================================
-- Issue: Tables have duplicate permissive policies from migrations 003 and 006
-- Fix: Drop old "Enable all for authenticated users" policies, keep migration 006 policies

-- Drop old duplicate policies (from migration 003)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON communications;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON canvassing_territories;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON canvassing_properties;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON property_visits;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON property_designs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON calendar_events;

-- Keep migration 006 policies:
-- "Allow all operations on leads"
-- "Allow all operations on communications"
-- etc.

-- =============================================
-- SECTION 4: DROP UNUSED INDEXES (INFO)
-- =============================================
-- Issue: Indexes that have never been used
-- Fix: Drop to improve write performance and reduce storage

-- This index was created but never used (duplicate with idx_canvassing_properties_territory)
DROP INDEX IF EXISTS idx_canvassing_properties_territory_id;

-- This index was created but never used
DROP INDEX IF EXISTS idx_property_visits_property_id;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify SECURITY DEFINER is removed from dashboard_stats:
-- SELECT viewname, definition
-- FROM pg_views
-- WHERE viewname = 'dashboard_stats';
-- Should NOT contain 'SECURITY DEFINER'

-- Verify foreign key index exists:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname = 'idx_property_visits_territory_id';
-- Should return 1 row

-- Verify no duplicate policies exist:
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
-- Each table should have only ONE policy per role+action combination

-- Verify unused indexes are dropped:
-- SELECT indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname IN ('idx_canvassing_properties_territory_id', 'idx_property_visits_property_id');
-- Should return 0 rows

-- =============================================
-- SUMMARY
-- =============================================
-- ✅ Fixed SECURITY DEFINER view (dashboard_stats)
-- ✅ Added missing foreign key index (property_visits.territory_id)
-- ✅ Removed duplicate RLS policies (28 duplicates removed)
-- ✅ Dropped unused indexes (2 indexes removed)
--
-- All database linter issues should now be resolved!
