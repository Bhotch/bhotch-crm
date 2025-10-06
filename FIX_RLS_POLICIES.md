# Fix RLS Policies - URGENT

## Issue
Leads cannot be created because RLS (Row Level Security) is enabled but no policies exist.

Error: `new row violates row-level security policy for table "leads"`

## Solution

### Option 1: Apply via Supabase Dashboard SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd/sql/new
2. Copy and paste the SQL from `supabase/migrations/006_enable_rls_with_policies.sql`
3. Click "Run"

### Option 2: Quick Fix (Run this SQL directly)

```sql
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policy allowing all operations on leads
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
CREATE POLICY "Allow all operations on leads"
ON leads FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy allowing all operations on communications
DROP POLICY IF EXISTS "Allow all operations on communications" ON communications;
CREATE POLICY "Allow all operations on communications"
ON communications FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy allowing all operations on canvassing_territories
DROP POLICY IF EXISTS "Allow all operations on canvassing_territories" ON canvassing_territories;
CREATE POLICY "Allow all operations on canvassing_territories"
ON canvassing_territories FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy allowing all operations on canvassing_properties
DROP POLICY IF EXISTS "Allow all operations on canvassing_properties" ON canvassing_properties;
CREATE POLICY "Allow all operations on canvassing_properties"
ON canvassing_properties FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy allowing all operations on property_visits
DROP POLICY IF EXISTS "Allow all operations on property_visits" ON property_visits;
CREATE POLICY "Allow all operations on property_visits"
ON property_visits FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy allowing all operations on property_designs
DROP POLICY IF EXISTS "Allow all operations on property_designs" ON property_designs;
CREATE POLICY "Allow all operations on property_designs"
ON property_designs FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy allowing all operations on calendar_events
DROP POLICY IF EXISTS "Allow all operations on calendar_events" ON calendar_events;
CREATE POLICY "Allow all operations on calendar_events"
ON calendar_events FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
```

### Option 3: Use Supabase CLI (if logged in)

```bash
npx supabase login
npx supabase link --project-ref lvwehhyeoolktdlvaikd
npx supabase db push
```

## Verification

After applying the migration, verify with:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('leads', 'communications', 'canvassing_territories',
                  'canvassing_properties', 'property_visits', 'property_designs', 'calendar_events');

-- Check policies exist
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

## Security Note

These policies allow ALL operations for anonymous and authenticated users. This is appropriate for a private CRM application. For a public-facing app, you would want more restrictive policies.
