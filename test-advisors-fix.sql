-- =============================================
-- TEST SCRIPT FOR ADVISOR FIXES
-- =============================================
-- Run this script to verify all security advisors are fixed
-- Execute after migration 013_fix_security_advisors.sql
-- =============================================

-- =============================================
-- TEST 1: Verify views are SECURITY INVOKER
-- =============================================
SELECT
  'TEST 1: Security Invoker Views' as test_name,
  schemaname,
  viewname,
  viewowner,
  CASE
    WHEN definition LIKE '%security_invoker%' THEN 'PASS: SECURITY INVOKER'
    ELSE 'FAIL: May be SECURITY DEFINER'
  END as result
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('communication_summary_by_customer', 'follow_up_reminders')
ORDER BY viewname;

-- =============================================
-- TEST 2: Verify functions have search_path set
-- =============================================
SELECT
  'TEST 2: Function Search Path' as test_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN 'PASS: Has search_path'
    ELSE 'FAIL: Missing search_path'
  END as result,
  CASE
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('set_follow_up_date', 'update_lead_last_contact', 'get_user_daily_stats', 'optimize_route')
ORDER BY p.proname;

-- =============================================
-- TEST 3: Verify foreign key indexes exist
-- =============================================
SELECT
  'TEST 3: Foreign Key Indexes' as test_name,
  schemaname,
  tablename,
  indexname,
  'PASS: Index exists' as result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_canvassing_properties_territory_fk',
  'idx_property_visits_property_fk',
  'idx_property_visits_territory_fk'
)
ORDER BY tablename, indexname;

-- Count check (should be 3)
SELECT
  'TEST 3b: Foreign Key Index Count' as test_name,
  COUNT(*) as index_count,
  CASE
    WHEN COUNT(*) = 3 THEN 'PASS: All 3 indexes exist'
    ELSE 'FAIL: Expected 3 indexes, found ' || COUNT(*)::text
  END as result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_canvassing_properties_territory_fk',
  'idx_property_visits_property_fk',
  'idx_property_visits_territory_fk'
);

-- =============================================
-- TEST 4: Verify RLS is enabled
-- =============================================
SELECT
  'TEST 4: RLS Status' as test_name,
  schemaname,
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN 'PASS: RLS enabled'
    ELSE 'FAIL: RLS disabled'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'leads',
  'communications',
  'canvassing_properties',
  'property_visits',
  'canvassing_territories',
  'canvassing_routes',
  'team_locations',
  'canvassing_competitions',
  'user_achievements',
  'offline_sync_queue'
)
ORDER BY tablename;

-- =============================================
-- SUMMARY: Overall Test Results
-- =============================================
SELECT
  '========== SUMMARY ==========' as summary,
  (
    SELECT COUNT(*)
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN ('communication_summary_by_customer', 'follow_up_reminders')
    AND definition LIKE '%security_invoker%'
  ) || ' / 2 views are SECURITY INVOKER' as views_status,
  (
    SELECT COUNT(*)
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('set_follow_up_date', 'update_lead_last_contact', 'get_user_daily_stats', 'optimize_route')
    AND pg_get_functiondef(p.oid) LIKE '%SET search_path%'
  ) || ' / 4 functions have search_path' as functions_status,
  (
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname IN (
      'idx_canvassing_properties_territory_fk',
      'idx_property_visits_property_fk',
      'idx_property_visits_territory_fk'
    )
  ) || ' / 3 foreign key indexes exist' as indexes_status;

-- =============================================
-- NOTES
-- =============================================
-- All tests should show PASS status
-- If any tests show FAIL:
--   1. Ensure migration 013_fix_security_advisors.sql has been applied
--   2. Check for migration errors in the logs
--   3. Manually verify the schema objects in question
--
-- Expected results:
--   - 2 views should be SECURITY INVOKER
--   - 4 functions should have search_path = public, pg_temp
--   - 3 foreign key indexes should exist
--   - All tables should have RLS enabled
-- =============================================
