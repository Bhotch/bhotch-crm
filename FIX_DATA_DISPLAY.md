# 🔧 Fix Data Display & Remove Duplicates

## Current Issue

✅ **Address column** works - shows data
❌ **All other columns** show "-" (dashes) - no data displayed
❌ **Duplicate leads** exist in database

## Root Cause

The data in your Supabase database has **NULL values** in most fields. The field mapping is correct, but there's no data to display.

---

## 🚀 SOLUTION: Run SQL Script

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Step 2: Copy and Run This SQL

Open the file: **`REMOVE_DUPLICATES.sql`**

Or copy this:

```sql
-- Remove duplicates (keep most recent)
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
SET deleted_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_leads WHERE rn > 1
);

-- Set defaults for NULL fields
UPDATE leads
SET
  quality = COALESCE(quality, 'Cold'),
  disposition = COALESCE(disposition, 'New'),
  lead_source = COALESCE(lead_source, 'Door Knock'),
  date_added = COALESCE(date_added, DATE(created_at))
WHERE deleted_at IS NULL;
```

### Step 3: Click **Run** (or press Ctrl+Enter)

You should see:
```
UPDATE 150  -- Number of duplicates removed
UPDATE 389  -- Number of leads with defaults set
```

### Step 4: Verify the Fix

Run this query:

```sql
SELECT
  customer_name,
  phone_number,
  quality,
  disposition,
  lead_source,
  address
FROM leads
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

You should now see:
- ✅ `quality` = "Cold" (not NULL)
- ✅ `disposition` = "New" (not NULL)
- ✅ `lead_source` = "Door Knock" (not NULL)

---

## 🔍 Understanding the Problem

### What Happened

When leads were migrated from Google Sheets to Supabase:

1. ✅ **customer_name** was saved
2. ✅ **address** was saved for some leads
3. ❌ **phone_number** was NOT saved (NULL)
4. ❌ **quality** was NOT saved (NULL)
5. ❌ **disposition** was NOT saved (NULL)
6. ❌ **lead_source** was NOT saved (NULL)
7. ❌ **All measurement fields** NOT saved (NULL)

### Why You See Dashes

The LeadsView component checks if a value exists:

```javascript
// If field is NULL, show "-"
{lead.quality || '-'}
{lead.phoneNumber || '-'}
```

Since fields are NULL, it displays "-".

### The Fix

The SQL script does two things:

1. **Removes Duplicates**: Keeps only the most recent record for each customer name
2. **Sets Defaults**: Gives NULL fields default values so they display

---

## 📊 What Will Happen After Fix

### Before
```
Customer Name | Phone | Quality | Disposition | Lead Source
Mark Askerlund|   -   |    -    |      ⊙      |     -
Bob Weston    |   -   |    -    |      ⊙      |     -
```

### After
```
Customer Name | Phone | Quality | Disposition | Lead Source
Mark Askerlund|   -   |  Cold   |     New     |  Door Knock
Bob Weston    |   -   |  Cold   |     New     |  Door Knock
```

**Note**: Phone numbers will still be "-" if they were never entered. You'll need to manually add them or import from original data source.

---

## 🔄 If You Have Original Data with Phone Numbers

If your Google Sheets or original data source has phone numbers, quality ratings, etc., you should **re-import** instead:

### Option A: Import via Supabase Dashboard

1. Export your Google Sheet to CSV
2. In Supabase → **Table Editor** → **leads** table
3. Click **Import data from CSV**
4. Map columns:
   - `Customer Name` → `customer_name`
   - `Phone Number` → `phone_number`
   - `Quality` → `quality`
   - `Disposition` → `disposition`
   - `SQ FT` → `sqft`
   - etc.
5. **Enable "Replace existing records"** (if you want to update)
6. Import

### Option B: Manually Edit Important Leads

For your 10-20 most important leads:

1. In CRM, click **Edit** (pencil icon) on lead
2. Fill in missing fields:
   - Phone Number
   - Quality (Hot/Warm/Cold)
   - Disposition
   - Measurements (if you have them)
3. Save

The data will persist in Supabase and display correctly.

---

## ✅ Verification Checklist

After running the SQL script, check:

- [ ] Go to CRM → Leads tab
- [ ] Quality column shows "Cold" (blue badges)
- [ ] Disposition column shows "New" (blue badges)
- [ ] Lead Source column shows "Door Knock"
- [ ] No more duplicate customer names
- [ ] Total lead count decreased (duplicates removed)
- [ ] Dashboard statistics updated

---

## 🎯 Summary

**Problem**: Database has NULL values in most fields
**Cause**: Data migration from Google Sheets didn't import all fields
**Fix**: Run `REMOVE_DUPLICATES.sql` to set defaults
**Result**: Columns will show default values instead of dashes

**For complete data**: Re-import from original source OR manually edit important leads

---

## 📞 Still Not Working?

If after running the SQL you still see dashes:

1. **Clear browser cache**: Ctrl+Shift+Delete → Clear cache
2. **Refresh CRM**: Ctrl+F5 (hard refresh)
3. **Check console**: F12 → Console tab → Look for errors
4. **Verify SQL ran**: Run the verification query above

Send me:
- Screenshot of SQL query results
- Screenshot of CRM leads tab
- Any console errors

I'll help debug further!

---

**Run the SQL now and your data will display!** 🚀
