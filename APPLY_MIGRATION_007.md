# Apply Migration 007 - Fix Database Linter Issues

## Overview
This migration fixes all issues identified by the Supabase database linter.

## Issues Fixed

### 1. ❌ ERROR: Security Definer View
- **Issue**: `dashboard_stats` view uses SECURITY DEFINER (security risk)
- **Fix**: Recreated view with SECURITY INVOKER (default, safer)

### 2. ⚠️ WARN: Multiple Permissive Policies (28 warnings)
- **Issue**: Duplicate RLS policies causing performance degradation
- **Fix**: Removed old duplicate policies, kept migration 006 policies

### 3. ℹ️ INFO: Unindexed Foreign Key
- **Issue**: `property_visits.territory_id` foreign key has no index
- **Fix**: Created `idx_property_visits_territory_id` index

### 4. ℹ️ INFO: Unused Indexes (2 indexes)
- **Issue**: Unused indexes wasting storage and slowing writes
- **Fix**: Dropped `idx_canvassing_properties_territory_id` and `idx_property_visits_property_id`

## How to Apply

### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd/sql/new

2. Copy the entire SQL from: `supabase/migrations/007_fix_database_linter_issues.sql`

3. Paste into SQL editor

4. Click **"Run"**

5. Verify success message appears

### Option 2: Copy SQL Directly

```sql
-- Copy and run the SQL from migration 007
-- See: supabase/migrations/007_fix_database_linter_issues.sql
```

## Verification

After applying the migration, run these queries to verify:

### 1. Verify SECURITY DEFINER is removed:
```sql
SELECT viewname, definition
FROM pg_views
WHERE viewname = 'dashboard_stats';
```
✅ Should NOT contain 'SECURITY DEFINER'

### 2. Verify foreign key index exists:
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname = 'idx_property_visits_territory_id';
```
✅ Should return 1 row

### 3. Verify no duplicate policies:
```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```
✅ Each table should have only ONE policy per role+action (not two)

### 4. Verify unused indexes are dropped:
```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN ('idx_canvassing_properties_territory_id', 'idx_property_visits_property_id');
```
✅ Should return 0 rows

## Expected Results

After applying migration 007:

- ✅ **0 ERRORS** (was 1)
- ✅ **0 WARNINGS** (was 28)
- ✅ **0 INFO** (was 3, but resolved performance issues)

All database linter checks should pass!

## Performance Impact

### Improvements:
- ✨ Faster queries on `property_visits.territory_id` (new index)
- ✨ Better RLS performance (removed 28 duplicate policy checks)
- ✨ Faster writes (removed 2 unused indexes)
- ✨ Improved security (SECURITY INVOKER on view)

### No Breaking Changes:
- All existing functionality preserved
- No data loss
- Application continues working normally

## Troubleshooting

If you encounter errors:

1. **"relation already exists"** - Migration already applied, safe to ignore
2. **"policy does not exist"** - Old policies already removed, safe to ignore
3. **"index does not exist"** - Unused indexes already removed, safe to ignore

All `IF EXISTS` and `IF NOT EXISTS` clauses ensure safe re-running.

## Next Steps

After applying migration 007:

1. ✅ Re-run Supabase database linter
2. ✅ Verify all issues are resolved
3. ✅ Test application functionality
4. ✅ Commit migration file to git

---

**Migration Status:** Ready to apply
**Impact:** Performance improvement + Security fix
**Downtime Required:** None (zero-downtime migration)
