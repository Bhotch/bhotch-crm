# Supabase Security Fixes - Manual Application

## Security Issues Detected

The Supabase Security Advisor detected 3 issues:

1. **Function Search Path Mutable (WARN)** - `update_updated_at_column()`
2. **Function Search Path Mutable (WARN)** - `increment_property_visit_count()`
3. **Security Definer View (ERROR)** - `dashboard_stats` view

## How to Apply Fixes

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/002_security_fixes.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify all statements execute successfully

### Option 2: Using psql (Advanced)

```bash
# Set your database URL (get from Supabase Dashboard > Settings > Database)
psql "postgresql://postgres:[YOUR-PASSWORD]@db.lvwehhyeoolktdlvaikd.supabase.co:5432/postgres" < supabase/migrations/002_security_fixes.sql
```

## Verification

After applying the fixes, verify they worked:

1. Go to **Database** > **Advisors** in Supabase Dashboard
2. Click **Run Checks**
3. Verify all security warnings are resolved

Expected result:
- ✅ Function `update_updated_at_column` has fixed search_path
- ✅ Function `increment_property_visit_count` has fixed search_path
- ✅ View `dashboard_stats` uses SECURITY INVOKER

## What the Fixes Do

### Fix 1 & 2: Function Search Path
- Adds `SECURITY INVOKER` - function runs with caller's permissions
- Adds `SET search_path = public` - prevents search path injection attacks
- Makes functions more secure against privilege escalation

### Fix 3: Security Definer View
- Changes view from `SECURITY DEFINER` to `SECURITY INVOKER`
- View now uses querying user's RLS policies, not creator's
- Prevents potential privilege escalation through views

## Impact on Application

✅ No breaking changes - all existing functionality continues to work
✅ Improved security posture
✅ RLS policies now properly enforced on dashboard_stats view
✅ Functions protected against search_path injection

## Files Modified

- `supabase/migrations/002_security_fixes.sql` - New migration with all fixes
