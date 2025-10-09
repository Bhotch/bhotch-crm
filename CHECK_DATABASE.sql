-- Run this in Supabase SQL Editor to check your data
-- https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd/editor

-- Check what fields have data
SELECT
  id,
  customer_name,
  first_name,
  last_name,
  phone_number,
  email,
  address,
  quality,
  disposition,
  lead_source,
  sqft,
  ridge_lf,
  valley_lf,
  dabella_quote,
  created_at
FROM leads
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check how many leads have each field populated
SELECT
  COUNT(*) as total_leads,
  COUNT(customer_name) as has_customer_name,
  COUNT(phone_number) as has_phone_number,
  COUNT(email) as has_email,
  COUNT(address) as has_address,
  COUNT(quality) as has_quality,
  COUNT(disposition) as has_disposition,
  COUNT(lead_source) as has_lead_source,
  COUNT(sqft) as has_sqft,
  COUNT(ridge_lf) as has_ridge_lf,
  COUNT(dabella_quote) as has_dabella_quote
FROM leads
WHERE deleted_at IS NULL;

-- Check one specific lead in detail
SELECT *
FROM leads
WHERE customer_name LIKE '%Mark%'
OR customer_name LIKE '%Candy%'
LIMIT 1;
