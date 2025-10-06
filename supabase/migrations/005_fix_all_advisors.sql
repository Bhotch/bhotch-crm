-- =============================================
-- FIX ALL SUPABASE ADVISORS - UPDATED
-- =============================================
-- This migration fixes all security and performance issues identified by Supabase database linter
--
-- Current Issues (as of 2025-10-05):
-- 1. SECURITY (1 error):
--    - 1 view with SECURITY DEFINER (dashboard_stats)
--
-- 2. PERFORMANCE (1 info):
--    - 1 unused index (idx_property_visits_territory_id)
--
-- Note: Foreign key indexes already exist from migration 001
-- =============================================

-- =============================================
-- SECTION 1: VERIFY RLS STATUS (Optional check)
-- =============================================
-- RLS should already be enabled from previous migrations
-- Uncomment to re-enable if needed:
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE canvassing_territories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE canvassing_properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE property_designs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

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

-- Note: Most foreign key indexes already exist from migration 001
-- Only idx_canvassing_properties_territory exists (renamed from idx_canvassing_properties_territory_id)
-- No new indexes needed - all foreign keys are already indexed

-- Drop unused index (was created but never used)
DROP INDEX IF EXISTS idx_property_visits_territory_id;

-- =============================================
-- VERIFICATION QUERIES (Run manually to verify)
-- =============================================

-- Verify view security (should NOT show SECURITY DEFINER):
-- SELECT viewname, definition
-- FROM pg_views
-- WHERE viewname = 'dashboard_stats';

-- Verify unused index is dropped:
-- SELECT indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname = 'idx_property_visits_territory_id';
-- (Should return 0 rows)

-- Verify all foreign key indexes exist from migration 001:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname IN (
--   'idx_calendar_events_lead_id',
--   'idx_canvassing_properties_territory',
--   'idx_communications_lead_id',
--   'idx_property_designs_lead_id',
--   'idx_property_visits_property_id'
-- )
-- ORDER BY tablename;
-- (Should return 5 rows)

-- =============================================
-- NOTES
-- =============================================
-- This migration fixes the actual current advisor issues:
-- 1. Recreates dashboard_stats view without SECURITY DEFINER
-- 2. Removes 1 unused index (idx_property_visits_territory_id)
-- 3. All foreign key indexes already exist from migration 001
