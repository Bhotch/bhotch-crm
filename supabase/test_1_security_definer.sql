-- =============================================
-- TEST 1: Verify dashboard_stats view uses SECURITY INVOKER
-- =============================================
-- Expected: Should NOT contain 'SECURITY DEFINER' in definition
-- If SECURITY DEFINER appears, the view is using creator's permissions (BAD)
-- If not present, it uses SECURITY INVOKER by default (GOOD)

SELECT
    viewname,
    CASE
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'FAIL: Uses SECURITY DEFINER'
        ELSE 'PASS: Uses SECURITY INVOKER (default)'
    END AS security_status,
    definition
FROM pg_views
WHERE viewname = 'dashboard_stats'
  AND schemaname = 'public';

-- Expected output: 1 row with security_status = 'PASS: Uses SECURITY INVOKER (default)'
