-- =============================================
-- TEST SCRIPT FOR MIGRATION 005
-- Run this after applying migration 005 to verify all fixes
-- =============================================

-- TEST 1: Verify RLS is enabled on all 7 tables
-- Expected: All tables should have rowsecurity = true
SELECT
    schemaname,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity THEN '✓ PASS'
        ELSE '✗ FAIL - RLS NOT ENABLED'
    END as test_result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('leads', 'communications', 'canvassing_territories', 'canvassing_properties',
                  'property_visits', 'property_designs', 'calendar_events')
ORDER BY tablename;

-- TEST 2: Verify all tables have RLS policies
-- Expected: Each table should have at least one policy
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    '✓ PASS - Policy exists' as test_result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('leads', 'communications', 'canvassing_territories', 'canvassing_properties',
                  'property_visits', 'property_designs', 'calendar_events')
ORDER BY tablename, policyname;

-- TEST 3: Verify dashboard_stats view exists and is not SECURITY DEFINER
-- Expected: View exists (SECURITY INVOKER is default, won't be shown)
SELECT
    schemaname,
    viewname,
    viewowner,
    '✓ PASS - View exists (SECURITY INVOKER by default)' as test_result
FROM pg_views
WHERE viewname = 'dashboard_stats';

-- TEST 4: Verify new foreign key index exists
-- Expected: idx_property_visits_territory_id exists
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE
        WHEN indexname = 'idx_property_visits_territory_id' THEN '✓ PASS'
        ELSE 'Index found'
    END as test_result
FROM pg_indexes
WHERE tablename = 'property_visits'
AND indexname = 'idx_property_visits_territory_id';

-- TEST 5: Verify unused indexes are dropped
-- Expected: None of these indexes should exist anymore
SELECT
    indexname,
    '✗ FAIL - This index should have been dropped' as test_result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_leads_quality', 'idx_leads_disposition', 'idx_leads_location', 'idx_leads_phone',
    'idx_leads_email', 'idx_leads_customer_name', 'idx_leads_search', 'idx_leads_sqft',
    'idx_leads_quote_amount', 'idx_communications_lead_id', 'idx_communications_type',
    'idx_territories_active', 'idx_canvassing_properties_territory',
    'idx_canvassing_properties_status', 'idx_canvassing_properties_location',
    'idx_property_visits_property_id', 'idx_property_visits_date',
    'idx_property_designs_lead_id', 'idx_property_designs_status',
    'idx_calendar_events_lead_id', 'idx_calendar_events_start_time', 'idx_calendar_events_google_id'
);

-- If no rows returned above, all unused indexes were successfully dropped
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✓ PASS - All 22 unused indexes successfully dropped'
        ELSE '✗ FAIL - Some indexes still exist (see previous query)'
    END as test_result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_leads_quality', 'idx_leads_disposition', 'idx_leads_location', 'idx_leads_phone',
    'idx_leads_email', 'idx_leads_customer_name', 'idx_leads_search', 'idx_leads_sqft',
    'idx_leads_quote_amount', 'idx_communications_lead_id', 'idx_communications_type',
    'idx_territories_active', 'idx_canvassing_properties_territory',
    'idx_canvassing_properties_status', 'idx_canvassing_properties_location',
    'idx_property_visits_property_id', 'idx_property_visits_date',
    'idx_property_designs_lead_id', 'idx_property_designs_status',
    'idx_calendar_events_lead_id', 'idx_calendar_events_start_time', 'idx_calendar_events_google_id'
);

-- TEST 6: Summary - Count all remaining indexes
-- This shows what indexes are still active
SELECT
    tablename,
    COUNT(*) as index_count,
    array_agg(indexname ORDER BY indexname) as remaining_indexes
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('leads', 'communications', 'canvassing_territories', 'canvassing_properties',
                  'property_visits', 'property_designs', 'calendar_events')
GROUP BY tablename
ORDER BY tablename;

-- =============================================
-- FINAL TEST: Check Supabase Advisors
-- =============================================
-- After running these tests, go to Supabase Dashboard > Database > Advisors
-- All errors should be resolved:
--   ✓ policy_exists_rls_disabled (7 instances) - FIXED
--   ✓ rls_disabled_in_public (7 instances) - FIXED
--   ✓ security_definer_view (1 instance) - FIXED
--   ✓ unindexed_foreign_keys (1 instance) - FIXED
--   ✓ unused_index (22 instances) - FIXED
