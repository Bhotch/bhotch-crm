-- =====================================================
-- REMOVE DUPLICATE LEADS AND FIX DATA DISPLAY
-- =====================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd/editor
-- =====================================================

-- STEP 1: Check for duplicate leads
-- =====================================================

-- Find duplicates by customer name
SELECT
  customer_name,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as lead_ids
FROM leads
WHERE deleted_at IS NULL
GROUP BY customer_name
HAVING COUNT(*) > 1
ORDER BY count DESC, customer_name;

-- Find duplicates by phone number
SELECT
  phone_number,
  COUNT(*) as count,
  STRING_AGG(customer_name, ', ') as names,
  STRING_AGG(id::text, ', ') as lead_ids
FROM leads
WHERE deleted_at IS NULL
  AND phone_number IS NOT NULL
GROUP BY phone_number
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 2: Keep the most recent record and soft-delete duplicates
-- =====================================================

-- For each duplicate customer_name, keep only the most recent one
WITH ranked_leads AS (
  SELECT
    id,
    customer_name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY customer_name ORDER BY created_at DESC) as rn
  FROM leads
  WHERE deleted_at IS NULL
)
UPDATE leads
SET
  deleted_at = NOW(),
  notes = COALESCE(notes || E'\n\n', '') || 'Auto-deleted as duplicate - kept most recent record'
WHERE id IN (
  SELECT id FROM ranked_leads WHERE rn > 1
);

-- STEP 3: Verify duplicates removed
-- =====================================================

SELECT
  customer_name,
  COUNT(*) as count
FROM leads
WHERE deleted_at IS NULL
GROUP BY customer_name
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- STEP 4: Check what data exists in remaining leads
-- =====================================================

SELECT
  COUNT(*) as total_leads,
  COUNT(customer_name) as has_name,
  COUNT(phone_number) as has_phone,
  COUNT(email) as has_email,
  COUNT(address) as has_address,
  COUNT(quality) as has_quality,
  COUNT(disposition) as has_disposition,
  COUNT(lead_source) as has_source,
  COUNT(sqft) as has_sqft,
  COUNT(ridge_lf) as has_ridge,
  COUNT(dabella_quote) as has_quote
FROM leads
WHERE deleted_at IS NULL;

-- STEP 5: View sample data to see what fields are populated
-- =====================================================

SELECT
  customer_name,
  phone_number,
  quality,
  disposition,
  lead_source,
  address,
  sqft,
  created_at
FROM leads
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- STEP 6: Set defaults for NULL critical fields
-- =====================================================

-- Set default quality
UPDATE leads
SET quality = 'Cold'
WHERE quality IS NULL
  AND deleted_at IS NULL;

-- Set default disposition
UPDATE leads
SET disposition = 'New'
WHERE disposition IS NULL
  AND deleted_at IS NULL;

-- Set default lead source
UPDATE leads
SET lead_source = 'Door Knock'
WHERE lead_source IS NULL
  AND deleted_at IS NULL;

-- Set default date_added
UPDATE leads
SET date_added = DATE(created_at)
WHERE date_added IS NULL
  AND created_at IS NOT NULL
  AND deleted_at IS NULL;

-- STEP 7: Final verification
-- =====================================================

-- Check updated counts
SELECT
  COUNT(*) as total_active_leads,
  COUNT(*) FILTER (WHERE quality IS NOT NULL) as has_quality,
  COUNT(*) FILTER (WHERE disposition IS NOT NULL) as has_disposition,
  COUNT(*) FILTER (WHERE lead_source IS NOT NULL) as has_source,
  COUNT(*) FILTER (WHERE phone_number IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE address IS NOT NULL) as has_address
FROM leads
WHERE deleted_at IS NULL;

-- View final sample
SELECT
  customer_name,
  phone_number,
  quality,
  disposition,
  lead_source,
  address,
  created_at
FROM leads
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- NOTES
-- =====================================================
-- After running this script:
-- 1. Duplicates are soft-deleted (can be recovered if needed)
-- 2. Each customer name appears only once
-- 3. Most recent record is kept for each duplicate
-- 4. NULL fields have default values set
-- 5. Data should now display in CRM
-- =====================================================
