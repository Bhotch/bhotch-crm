-- =============================================
-- FINAL DATABASE LINTER FIXES
-- =============================================
-- Addresses remaining linter issues:
-- 1. SECURITY DEFINER view (ERROR) - dashboard_stats still has it
-- 2. Unindexed foreign keys (INFO) - 2 missing indexes
-- 3. Unused index (INFO) - idx_property_visits_territory_id not being used
-- =============================================

-- =============================================
-- FIX 1: Remove SECURITY DEFINER from dashboard_stats
-- =============================================
DROP VIEW IF EXISTS dashboard_stats CASCADE;

CREATE VIEW dashboard_stats AS
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

-- Grant permissions (without SECURITY DEFINER)
GRANT SELECT ON dashboard_stats TO anon, authenticated;

-- =============================================
-- FIX 2: Add missing foreign key indexes
-- =============================================

-- Index for canvassing_properties.territory_id foreign key
CREATE INDEX IF NOT EXISTS idx_canvassing_properties_territory_id
ON canvassing_properties(territory_id);

-- Index for property_visits.property_id foreign key
CREATE INDEX IF NOT EXISTS idx_property_visits_property_id
ON property_visits(property_id);

-- =============================================
-- FIX 3: Remove the unused idx_property_visits_territory_id
-- =============================================
-- This index was added in migration 007 but is not being used
-- The property_visits table needs property_id indexed, not territory_id

DROP INDEX IF EXISTS idx_property_visits_territory_id;

-- =============================================
-- VERIFICATION
-- =============================================

COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics - SECURITY INVOKER (no SECURITY DEFINER)';
COMMENT ON INDEX idx_canvassing_properties_territory_id IS 'Index for canvassing_properties.territory_id foreign key';
COMMENT ON INDEX idx_property_visits_property_id IS 'Index for property_visits.property_id foreign key';
