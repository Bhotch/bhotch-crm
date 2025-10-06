-- =============================================
-- OPTIMIZE DATABASE INDEXES
-- =============================================
-- Addresses remaining INFO-level linter warnings:
-- 1. property_visits.territory_id foreign key needs index
-- 2. Two unused indexes (just created in migration 008)
-- =============================================

-- =============================================
-- FIX 1: Add index for property_visits.territory_id
-- =============================================
-- The property_visits table has TWO foreign keys:
-- - property_id (already indexed in migration 008)
-- - territory_id (missing index - causing this warning)

CREATE INDEX IF NOT EXISTS idx_property_visits_territory_id
ON property_visits(territory_id);

COMMENT ON INDEX idx_property_visits_territory_id IS 'Index for property_visits.territory_id foreign key';

-- =============================================
-- FIX 2: Mark new indexes as used
-- =============================================
-- The "unused index" warnings for idx_canvassing_properties_territory_id
-- and idx_property_visits_property_id are expected - they were just created
-- in migration 008 and haven't been used yet.
--
-- These indexes will be used automatically when queries join or filter
-- on these foreign keys. No action needed - they are valid indexes.

-- =============================================
-- SUMMARY
-- =============================================
-- ✅ Added missing index for property_visits.territory_id
-- ✅ Unused index warnings are expected for new indexes (will be used over time)
--
-- All critical database linter issues are now resolved!
-- Remaining "unused index" warnings are informational only.
