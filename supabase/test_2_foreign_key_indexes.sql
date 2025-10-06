-- =============================================
-- TEST 2: Verify all foreign key indexes exist
-- =============================================
-- Expected: 5 indexes should exist from migration 001
-- These indexes improve query performance for foreign key lookups

SELECT
    indexname,
    tablename,
    'PASS' AS status
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

-- Expected output: 5 rows
-- If fewer rows, some indexes are missing (FAIL)

-- Verify count
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
