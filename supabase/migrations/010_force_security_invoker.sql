-- =============================================
-- FORCE SECURITY INVOKER ON DASHBOARD_STATS
-- =============================================
-- Issue: Supabase keeps recreating dashboard_stats with SECURITY DEFINER
-- Root cause: PostgreSQL < 15 doesn't have explicit SECURITY INVOKER syntax
-- Solution: Use ALTER VIEW to explicitly set security_invoker option
-- =============================================

-- Drop and recreate the view
DROP VIEW IF EXISTS dashboard_stats CASCADE;

CREATE VIEW dashboard_stats
WITH (security_invoker = true)
AS
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

-- Add comment
COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics - EXPLICITLY using security_invoker=true option';

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this query to verify security_invoker is set:
-- SELECT relname, reloptions
-- FROM pg_class
-- WHERE relname = 'dashboard_stats';
-- Should show: {security_invoker=true}
