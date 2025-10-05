-- =============================================
-- DISABLE RLS FOR DEVELOPMENT
-- =============================================
-- ⚠️ SUPERSEDED BY MIGRATION 005 ⚠️
-- This migration was used temporarily during development
-- Migration 005 re-enables RLS with proper security policies
-- =============================================
-- This allows the application to read/write data during development
-- IMPORTANT: Enable proper RLS policies before production deployment
-- STATUS: Superseded - RLS is now enabled via migration 005
-- =============================================

-- Disable RLS on all existing tables
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_territories DISABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_designs DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Note: For production, you should create proper RLS policies like:
--
-- CREATE POLICY "Allow all operations for development"
-- ON leads FOR ALL
-- TO anon, authenticated
-- USING (true)
-- WITH CHECK (true);
--
-- Repeat for each table: job_counts, communications, canvassing_territories,
-- canvassing_properties, property_visits, property_designs, calendar_events
