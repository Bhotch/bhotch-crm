-- =============================================
-- ENABLE RLS WITH PERMISSIVE POLICIES
-- =============================================
-- This migration enables RLS and creates policies that allow
-- all operations for authenticated and anonymous users
-- =============================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR LEADS
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;

-- Create policy allowing all operations
CREATE POLICY "Allow all operations on leads"
ON leads FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR COMMUNICATIONS
-- =============================================

DROP POLICY IF EXISTS "Allow all operations on communications" ON communications;

CREATE POLICY "Allow all operations on communications"
ON communications FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR CANVASSING_TERRITORIES
-- =============================================

DROP POLICY IF EXISTS "Allow all operations on canvassing_territories" ON canvassing_territories;

CREATE POLICY "Allow all operations on canvassing_territories"
ON canvassing_territories FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR CANVASSING_PROPERTIES
-- =============================================

DROP POLICY IF EXISTS "Allow all operations on canvassing_properties" ON canvassing_properties;

CREATE POLICY "Allow all operations on canvassing_properties"
ON canvassing_properties FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR PROPERTY_VISITS
-- =============================================

DROP POLICY IF EXISTS "Allow all operations on property_visits" ON property_visits;

CREATE POLICY "Allow all operations on property_visits"
ON property_visits FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR PROPERTY_DESIGNS
-- =============================================

DROP POLICY IF EXISTS "Allow all operations on property_designs" ON property_designs;

CREATE POLICY "Allow all operations on property_designs"
ON property_designs FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- CREATE PERMISSIVE POLICIES FOR CALENDAR_EVENTS
-- =============================================

DROP POLICY IF EXISTS "Allow all operations on calendar_events" ON calendar_events;

CREATE POLICY "Allow all operations on calendar_events"
ON calendar_events FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('leads', 'communications', 'canvassing_territories',
--                   'canvassing_properties', 'property_visits', 'property_designs', 'calendar_events');

-- Check policies exist:
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public';
