# 🔍 Debug Instructions - Find Missing Data Issue

## The Problem

Leads are loading from Supabase (you can see customer names), but most fields show "-":
- Phone Number: `-`
- Quality: `-`
- Disposition: `⊙` (icon but no text)
- Lead Source: `-`
- All measurement fields: `-`

## Possible Causes

1. **Fields are NULL in database** - Data was never saved to those columns
2. **Field mapping still wrong** - Even though we mapped, maybe the names are different
3. **Data type mismatch** - Values exist but wrong format

## 🚀 STEP 1: Run Locally and Check Console

```bash
cd c:\Users\PC_User\Desktop\free-crm\bhotch-crm
npm start
```

Wait for it to open at http://localhost:3000

## 📋 STEP 2: Open Browser Console

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Look for output that says: **"=== SUPABASE RAW DATA ==="**

You should see something like:

```javascript
=== SUPABASE RAW DATA ===
First lead from Supabase: {
  id: "...",
  customer_name: "Mark Askerlund",
  phone_number: "5551234567",  // OR null if empty
  quality: "Hot",              // OR null if empty
  disposition: "New",          // OR null if empty
  lead_source: "Door Knock",   // OR null if empty
  ...
}
Field names: ["id", "customer_name", "phone_number", "email", ...]
Phone number value: "5551234567"  // OR null
Quality value: "Hot"              // OR null
Disposition value: "New"          // OR null
Lead source value: "Door Knock"   // OR null
```

## 📸 STEP 3: Take Screenshot of Console

**IMPORTANT**: Take a screenshot showing the console output and send it to me.

I need to see:
1. What the actual field names are
2. What values are in those fields (or if they're `null`)

## 🔧 STEP 4: Alternative - Check Supabase Directly

If you can't run locally, check the database directly:

1. Go to https://supabase.com/dashboard
2. Select your project: `lvwehhyeoolktdlvaikd`
3. Click **SQL Editor** (left sidebar)
4. Run this query:

```sql
SELECT
  customer_name,
  phone_number,
  quality,
  disposition,
  lead_source,
  sqft,
  ridge_lf,
  dabella_quote
FROM leads
WHERE customer_name LIKE '%Mark%'
OR customer_name LIKE '%Candy%'
LIMIT 5;
```

**Take a screenshot of the results!**

## 📊 What I'm Looking For

The console/query will tell us:

### Scenario A: Fields are NULL
```javascript
phone_number: null
quality: null
disposition: null
// This means data was never saved to these columns
// FIX: We need to import/migrate your existing data
```

### Scenario B: Fields have different names
```javascript
phoneNumber: "5551234567"  // camelCase instead of snake_case!
// FIX: Need to update our field mapping
```

### Scenario C: Data exists but wrong format
```javascript
phone_number: "5551234567"  // Should work
quality: "hot"               // Lowercase instead of "Hot"
// FIX: Need to handle case sensitivity
```

## ⏭️ Next Steps

Once you send me the console output or SQL query results, I'll know exactly what's wrong and can fix it!

The fix will be ONE of:
1. **Data Migration** - Import your existing Google Sheets data to Supabase properly
2. **Field Name Fix** - Update mapping to match actual field names
3. **Format Fix** - Handle data type/case differences
4. **Default Values** - Set proper defaults when creating new leads

---

**Please run ONE of these:**
- Option A: `npm start` → F12 → Screenshot of console
- Option B: Supabase SQL Editor → Run query → Screenshot of results

Then send me the screenshot! 🎯
