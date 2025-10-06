-- =============================================
-- COMPREHENSIVE MIGRATION VERIFICATION SUITE
-- =============================================
-- Run this after applying migration 005_fix_all_advisors.sql
-- All tests should PASS for the migration to be considered successful

\echo '========================================='
\echo 'TEST 1: SECURITY DEFINER VIEW CHECK'
\echo '========================================='

SELECT
    viewname,
    CASE
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'FAIL: Uses SECURITY DEFINER'
        ELSE 'PASS: Uses SECURITY INVOKER (default)'
    END AS security_status
FROM pg_views
WHERE viewname = 'dashboard_stats'
  AND schemaname = 'public';

\echo ''
\echo '========================================='
\echo 'TEST 2: FOREIGN KEY INDEXES CHECK'
\echo '========================================='

SELECT
    COUNT(*) AS index_count,
    CASE
        WHEN COUNT(*) = 5 THEN 'PASS: All 5 foreign key indexes exist'
        ELSE 'FAIL: Missing indexes - expected 5, found ' || COUNT(*)
    END AS test_result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_calendar_events_lead_id',
    'idx_canvassing_properties_territory',
    'idx_communications_lead_id',
    'idx_property_designs_lead_id',
    'idx_property_visits_property_id'
);

\echo ''
\echo 'Details:'
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_calendar_events_lead_id',
    'idx_canvassing_properties_territory',
    'idx_communications_lead_id',
    'idx_property_designs_lead_id',
    'idx_property_visits_property_id'
)
ORDER BY tablename, indexname;

\echo ''
\echo '========================================='
\echo 'TEST 3: UNUSED INDEX REMOVAL CHECK'
\echo '========================================='

SELECT
    COUNT(*) AS index_exists,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS: Unused index successfully dropped'
        ELSE 'FAIL: Index still exists - migration did not execute'
    END AS test_result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname = 'idx_property_visits_territory_id';

\echo ''
\echo '========================================='
\echo 'SUMMARY'
\echo '========================================='
\echo 'All three tests should show PASS'
\echo 'If any test shows FAIL, check migration execution'
