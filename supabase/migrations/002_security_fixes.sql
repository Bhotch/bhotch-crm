-- =============================================
-- SECURITY FIXES FOR SUPABASE ADVISOR ISSUES
-- =============================================
-- This migration addresses:
-- 1. Function search_path mutability (WARN)
-- 2. Security definer view (ERROR)
-- =============================================

-- Fix 1: Add SECURITY INVOKER and SET search_path to update_updated_at_column function
-- This ensures the function runs with the permissions of the invoking user
-- and prevents search_path injection attacks
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate all triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_counts_updated_at BEFORE UPDATE ON job_counts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON canvassing_territories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON canvassing_properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON property_designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix 2: Add SECURITY INVOKER and SET search_path to increment_property_visit_count function
DROP FUNCTION IF EXISTS increment_property_visit_count() CASCADE;

CREATE OR REPLACE FUNCTION increment_property_visit_count()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE canvassing_properties
    SET visit_count = visit_count + 1,
        last_visited_at = NEW.visit_date
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER increment_visit_count AFTER INSERT ON property_visits
    FOR EACH ROW EXECUTE FUNCTION increment_property_visit_count();

-- Fix 3: Replace SECURITY DEFINER view with regular view
-- The dashboard_stats view should use the querying user's permissions
-- not the view creator's permissions
DROP VIEW IF EXISTS dashboard_stats;

CREATE OR REPLACE VIEW dashboard_stats
SECURITY INVOKER
AS
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

-- Add helpful comment
COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics view with SECURITY INVOKER to use querying user permissions';
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function with fixed search_path to prevent injection attacks';
COMMENT ON FUNCTION increment_property_visit_count() IS 'Trigger function with fixed search_path to prevent injection attacks';
