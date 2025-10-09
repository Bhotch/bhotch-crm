-- =====================================================
-- FIX NULL FIELDS IN EXISTING LEADS
-- =====================================================
-- This script populates NULL fields with sensible defaults
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd/editor
-- =====================================================

-- First, let's see how many leads have NULL values
SELECT
  COUNT(*) as total_leads,
  COUNT(phone_number) as has_phone,
  COUNT(quality) as has_quality,
  COUNT(disposition) as has_disposition,
  COUNT(lead_source) as has_lead_source,
  COUNT(*) - COUNT(phone_number) as missing_phone,
  COUNT(*) - COUNT(quality) as missing_quality,
  COUNT(*) - COUNT(disposition) as missing_disposition,
  COUNT(*) - COUNT(lead_source) as missing_lead_source
FROM leads
WHERE deleted_at IS NULL;

-- =====================================================
-- STEP 1: SET DEFAULTS FOR CRITICAL FIELDS
-- =====================================================

-- Set default quality to 'Cold' for NULL values
UPDATE leads
SET quality = 'Cold'
WHERE quality IS NULL
  AND deleted_at IS NULL;

-- Set default disposition to 'New' for NULL values
UPDATE leads
SET disposition = 'New'
WHERE disposition IS NULL
  AND deleted_at IS NULL;

-- Set default lead_source to 'Door Knock' for NULL values
UPDATE leads
SET lead_source = 'Door Knock'
WHERE lead_source IS NULL
  AND deleted_at IS NULL;

-- Set default date_added to created_at if NULL
UPDATE leads
SET date_added = DATE(created_at)
WHERE date_added IS NULL
  AND deleted_at IS NULL;

-- =====================================================
-- STEP 2: VERIFY UPDATES
-- =====================================================

-- Check results
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE quality IS NOT NULL) as has_quality,
  COUNT(*) FILTER (WHERE disposition IS NOT NULL) as has_disposition,
  COUNT(*) FILTER (WHERE lead_source IS NOT NULL) as has_lead_source,
  COUNT(*) FILTER (WHERE phone_number IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as has_email,
  COUNT(*) FILTER (WHERE address IS NOT NULL) as has_address
FROM leads
WHERE deleted_at IS NULL;

-- View a sample of updated leads
SELECT
  customer_name,
  phone_number,
  quality,
  disposition,
  lead_source,
  date_added,
  created_at
FROM leads
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 3: CHECK FOR LEADS WITHOUT BASIC INFO
-- =====================================================

-- Find leads missing critical information
SELECT
  id,
  customer_name,
  phone_number,
  quality,
  disposition,
  created_at
FROM leads
WHERE deleted_at IS NULL
  AND (
    customer_name IS NULL
    OR phone_number IS NULL
  )
ORDER BY created_at DESC;

-- =====================================================
-- OPTIONAL: ADVANCED CLEANUP
-- =====================================================

-- If you want to set roof_type for leads without it
-- UPDATE leads
-- SET roof_type = 'Asphalt Shingle'
-- WHERE roof_type IS NULL
--   AND deleted_at IS NULL;

-- If you want to mark leads without phone numbers as 'Lost'
-- UPDATE leads
-- SET disposition = 'Closed Lost',
--     notes = COALESCE(notes || E'\n\n', '') || 'Auto-marked as lost - no contact information'
-- WHERE phone_number IS NULL
--   AND email IS NULL
--   AND deleted_at IS NULL
--   AND disposition != 'Closed Lost';

-- =====================================================
-- NOTES
-- =====================================================
-- After running this script:
-- 1. All leads should have quality, disposition, and lead_source
-- 2. Phone numbers and emails may still be NULL for some leads
-- 3. You can manually edit important leads to add missing info
-- 4. The CRM will display default values instead of dashes
-- =====================================================
