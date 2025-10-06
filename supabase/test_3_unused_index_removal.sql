-- =============================================
-- TEST 3: Verify unused index was dropped
-- =============================================
-- Expected: idx_property_visits_territory_id should NOT exist
-- This index was created but never used, so it wastes space and slows down writes

SELECT
    COUNT(*) AS index_exists,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS: Unused index successfully dropped'
        ELSE 'FAIL: Index still exists - migration did not execute'
    END AS test_result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname = 'idx_property_visits_territory_id';

-- Expected output: index_exists = 0, test_result = 'PASS: Unused index successfully dropped'

-- Double-check: List all indexes on property_visits table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'property_visits'
ORDER BY indexname;

-- Expected: Should see idx_property_visits_property_id but NOT idx_property_visits_territory_id
