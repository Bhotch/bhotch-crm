-- =============================================
-- FIX REMAINING SUPABASE ADVISORS
-- =============================================
-- This migration fixes additional security and performance issues from new tables
--
-- Current Issues (as of 2025-10-08):
-- 1. SECURITY (9 issues):
--    - 5 tables with RLS disabled (canvassing_routes, team_locations, canvassing_competitions, user_achievements, offline_sync_queue)
--    - 4 functions with mutable search_path
--
-- 2. PERFORMANCE (16 info):
--    - 16 unused indexes to drop
-- =============================================

-- =============================================
-- SECTION 1: ENABLE RLS ON NEW TABLES
-- =============================================

-- Enable RLS on canvassing enhancements tables
ALTER TABLE canvassing_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON canvassing_routes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON team_locations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON canvassing_competitions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON user_achievements
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON offline_sync_queue
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- SECTION 2: FIX FUNCTION SEARCH PATHS
-- =============================================

-- Drop existing functions first to avoid type conflicts
DROP FUNCTION IF EXISTS calculate_territory_stats(UUID);
DROP FUNCTION IF EXISTS get_user_daily_stats(UUID, DATE);
DROP FUNCTION IF EXISTS optimize_route(UUID);

-- Drop trigger first, then function (handles dependency)
DROP TRIGGER IF EXISTS trg_update_territory_stats ON canvassing_properties;
DROP FUNCTION IF EXISTS update_territory_stats();

-- Fix mutable search_path on functions by setting explicit search_path
CREATE OR REPLACE FUNCTION calculate_territory_stats(territory_id_param UUID)
RETURNS TABLE (
  total_properties BIGINT,
  visited_properties BIGINT,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_properties,
    COUNT(*) FILTER (WHERE visited_at IS NOT NULL) AS visited_properties,
    ROUND(
      (COUNT(*) FILTER (WHERE visited_at IS NOT NULL)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS completion_rate
  FROM canvassing_properties
  WHERE territory_id = territory_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_daily_stats(user_id_param UUID, date_param DATE)
RETURNS TABLE (
  knocks INT,
  contacts INT,
  appointments INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS knocks,
    COUNT(*) FILTER (WHERE contact_made = true)::INT AS contacts,
    COUNT(*) FILTER (WHERE appointment_set = true)::INT AS appointments
  FROM property_visits
  WHERE user_id = user_id_param
    AND DATE(visited_at) = date_param;
END;
$$;

CREATE OR REPLACE FUNCTION optimize_route(route_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  optimized_waypoints JSONB;
BEGIN
  -- Simple optimization: order by lat/lng proximity
  SELECT jsonb_agg(
    jsonb_build_object(
      'property_id', id,
      'lat', (location->>'lat')::float,
      'lng', (location->>'lng')::float
    ) ORDER BY (location->>'lat')::float, (location->>'lng')::float
  )
  INTO optimized_waypoints
  FROM canvassing_properties
  WHERE route_id = route_id_param;

  RETURN optimized_waypoints;
END;
$$;

CREATE OR REPLACE FUNCTION update_territory_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update territory statistics when properties are modified
  UPDATE canvassing_territories
  SET updated_at = NOW()
  WHERE id = NEW.territory_id;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trg_update_territory_stats
  AFTER INSERT OR UPDATE ON canvassing_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_territory_stats();

-- =============================================
-- SECTION 3: DROP UNUSED INDEXES
-- =============================================

-- Drop unused indexes from canvassing_properties
DROP INDEX IF EXISTS idx_canvassing_properties_territory_id;
DROP INDEX IF EXISTS idx_canvassing_properties_photos;
DROP INDEX IF EXISTS idx_canvassing_properties_custom_fields;

-- Drop unused indexes from property_visits
DROP INDEX IF EXISTS idx_property_visits_property_id;
DROP INDEX IF EXISTS idx_property_visits_territory_id;

-- Drop unused indexes from canvassing_routes
DROP INDEX IF EXISTS idx_canvassing_routes_user_id;
DROP INDEX IF EXISTS idx_canvassing_routes_status;
DROP INDEX IF EXISTS idx_canvassing_routes_created_at;

-- Drop unused indexes from team_locations
DROP INDEX IF EXISTS idx_team_locations_user_id;
DROP INDEX IF EXISTS idx_team_locations_is_active;

-- Drop unused indexes from canvassing_competitions
DROP INDEX IF EXISTS idx_canvassing_competitions_status;
DROP INDEX IF EXISTS idx_canvassing_competitions_dates;

-- Drop unused indexes from user_achievements
DROP INDEX IF EXISTS idx_user_achievements_user_id;
DROP INDEX IF EXISTS idx_user_achievements_type;

-- Drop unused indexes from offline_sync_queue
DROP INDEX IF EXISTS idx_offline_sync_queue_user_id;
DROP INDEX IF EXISTS idx_offline_sync_queue_synced;

-- =============================================
-- VERIFICATION QUERIES (Run manually to verify)
-- =============================================

-- Verify RLS is enabled on new tables:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('canvassing_routes', 'team_locations', 'canvassing_competitions',
--                   'user_achievements', 'offline_sync_queue')
-- ORDER BY tablename;

-- Verify policies exist:
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('canvassing_routes', 'team_locations', 'canvassing_competitions',
--                   'user_achievements', 'offline_sync_queue')
-- ORDER BY tablename;

-- Verify functions have search_path set:
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname IN ('calculate_territory_stats', 'get_user_daily_stats',
--                   'optimize_route', 'update_territory_stats')
-- AND pronamespace = 'public'::regnamespace;

-- Verify unused indexes are dropped:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND (indexname LIKE '%_territory_id'
--      OR indexname LIKE '%_photos'
--      OR indexname LIKE '%_custom_fields'
--      OR indexname LIKE '%_user_id'
--      OR indexname LIKE '%_status'
--      OR indexname LIKE '%_created_at'
--      OR indexname LIKE '%_is_active'
--      OR indexname LIKE '%_dates'
--      OR indexname LIKE '%_type'
--      OR indexname LIKE '%_synced')
-- ORDER BY tablename, indexname;
-- (Should only show active indexes, not the ones we dropped)

-- =============================================
-- NOTES
-- =============================================
-- This migration addresses issues from migration 011_canvassing_enhancements.sql
-- All new tables now have RLS enabled with permissive policies for authenticated users
-- Functions have explicit search_path set to prevent security issues
-- Unused indexes removed to improve write performance
