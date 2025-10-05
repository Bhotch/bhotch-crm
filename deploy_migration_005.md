# Deploy Migration 005 - Fix All Advisors

## Prerequisites
- Access to Supabase Dashboard at https://lvwehhyeoolktdlvaikd.supabase.co
- Database connection credentials

## Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**
   - Go to https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd/sql
   - Or: Dashboard → SQL Editor

2. **Apply Migration 005**
   - Copy the entire contents of `supabase/migrations/005_fix_all_advisors.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Run Test Queries**
   - Open a new SQL Editor tab
   - Copy contents of `supabase/test_migration_005.sql`
   - Paste and run to verify all fixes

4. **Check Advisors**
   - Navigate to: Dashboard → Database → Advisors
   - Refresh the page
   - Verify all errors are resolved (39 total issues should be fixed)

### Option 2: Via Supabase CLI (If Docker is running)

```bash
# Ensure Docker Desktop is running
# Then run:
npx supabase db push --linked

# Run tests
npx supabase db reset --local
psql -h localhost -U postgres -d postgres -f supabase/test_migration_005.sql
```

### Option 3: Direct Database Connection

```bash
# Using psql or any PostgreSQL client
psql "postgresql://postgres:[password]@db.lvwehhyeoolktdlvaikd.supabase.co:5432/postgres" -f supabase/migrations/005_fix_all_advisors.sql

# Then run tests
psql "postgresql://postgres:[password]@db.lvwehhyeoolktdlvaikd.supabase.co:5432/postgres" -f supabase/test_migration_005.sql
```

## Expected Results

### Before Migration (39 total issues):
- ❌ 7 × `policy_exists_rls_disabled` errors
- ❌ 7 × `rls_disabled_in_public` errors
- ❌ 1 × `security_definer_view` error
- ❌ 1 × `unindexed_foreign_keys` info
- ❌ 22 × `unused_index` info

### After Migration (0 issues):
- ✅ All RLS enabled on 7 tables: `leads`, `communications`, `canvassing_territories`, `canvassing_properties`, `property_visits`, `property_designs`, `calendar_events`
- ✅ `dashboard_stats` view using SECURITY INVOKER (default)
- ✅ Foreign key index added: `idx_property_visits_territory_id`
- ✅ 22 unused indexes dropped
- ✅ All Supabase advisors passing

## Verification Checklist

Run each test query from `test_migration_005.sql`:

- [ ] **Test 1**: All 7 tables show `rowsecurity = true`
- [ ] **Test 2**: Each table has RLS policies defined
- [ ] **Test 3**: `dashboard_stats` view exists (SECURITY INVOKER)
- [ ] **Test 4**: `idx_property_visits_territory_id` index exists
- [ ] **Test 5**: All 22 unused indexes are dropped
- [ ] **Test 6**: Summary shows remaining active indexes only

## Rollback (If Needed)

If issues occur, rollback by:

```sql
-- Re-disable RLS (reverting to migration 003 state)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_territories DISABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_designs DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Drop added index
DROP INDEX IF EXISTS idx_property_visits_territory_id;

-- Recreate dropped indexes (if needed)
-- See migration 001_initial_schema.sql for original index definitions
```

## Post-Deployment

1. **Test Application**
   - Ensure all CRUD operations work
   - Verify authenticated users can access data
   - Check dashboard loads correctly

2. **Monitor Performance**
   - Check query performance without unused indexes
   - Verify new FK index improves join performance

3. **Update Documentation**
   - Mark migration 003 as superseded
   - Document that RLS is now enabled for production

## Notes

- Migration 005 supersedes migration 003 (`disable_rls_for_development.sql`)
- All existing RLS policies from migration 001 are still active
- Application should work identically if using `authenticated` role
- If using `anon` role, ensure policies allow appropriate access
