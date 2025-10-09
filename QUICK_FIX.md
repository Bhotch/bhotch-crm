# 🚨 QUICK FIX - Most Likely Issue

Based on the screenshots, I suspect the **data in Supabase is NULL** for most fields.

## Why This Happened

Your original 389 leads were probably in Google Sheets with different field names.
When you switched to Supabase, the leads table was created but most fields are empty.

The "Mark Askerlund" lead you just created through the CRM has data because it was saved correctly, but the OLD leads (389 total) don't have data in these fields.

## ✅ SOLUTION: Populate Missing Fields

### Option 1: Set Defaults for Existing Leads

Run this in Supabase SQL Editor to set reasonable defaults:

```sql
-- Update all leads with NULL quality to 'Cold'
UPDATE leads
SET quality = 'Cold'
WHERE quality IS NULL AND deleted_at IS NULL;

-- Update all leads with NULL disposition to 'New'
UPDATE leads
SET disposition = 'New'
WHERE disposition IS NULL AND deleted_at IS NULL;

-- Update all leads with NULL lead_source to 'Door Knock'
UPDATE leads
SET lead_source = 'Door Knock'
WHERE lead_source IS NULL AND deleted_at IS NULL;

-- Check results
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE quality IS NOT NULL) as has_quality,
  COUNT(*) FILTER (WHERE disposition IS NOT NULL) as has_disposition,
  COUNT(*) FILTER (WHERE lead_source IS NOT NULL) as has_lead_source
FROM leads
WHERE deleted_at IS NULL;
```

### Option 2: Import from Google Sheets

If you still have your Google Sheets data with phone numbers, quality, etc:

1. Export Google Sheet to CSV
2. In Supabase Dashboard → Table Editor → `leads` table
3. Click "Insert" → "Import data from CSV"
4. Map columns:
   - `Customer Name` → `customer_name`
   - `Phone Number` → `phone_number`
   - `Quality` → `quality`
   - `Disposition` → `disposition`
   - `SQ FT` → `sqft`
   - etc.

### Option 3: Manual Update for Key Leads

For your most important leads, manually edit them:

1. In CRM, click the **Edit** (pencil) icon on a lead
2. Fill in missing fields:
   - Phone Number
   - Quality (Hot/Warm/Cold)
   - Disposition (New/Quoted/etc)
   - Lead Source
3. Save

The data will now show in the table!

## 🔍 How to Verify It's a NULL Issue

Run this query in Supabase:

```sql
SELECT
  customer_name,
  phone_number IS NULL as missing_phone,
  quality IS NULL as missing_quality,
  disposition IS NULL as missing_disposition,
  lead_source IS NULL as missing_lead_source
FROM leads
WHERE deleted_at IS NULL
LIMIT 10;
```

If you see a lot of `true` values, that confirms fields are NULL.

## 🎯 Expected Results After Fix

Once you populate the NULL fields:

- **Phone Number** column: Shows formatted numbers like `(555) 123-4567`
- **Quality** column: Shows badges (Hot = red, Warm = yellow, Cold = blue)
- **Disposition** column: Shows status badges (New, Quoted, Closed, etc.)
- **Lead Source** column: Shows "Door Knock", "Referral", etc.

---

**TL;DR**: Your old leads from Google Sheets probably don't have data in these fields.
You need to either:
1. Set defaults using SQL (fast)
2. Re-import from Google Sheets with proper mapping (best)
3. Manually edit important leads (tedious)

Let me know what you see in the console or SQL query results!
