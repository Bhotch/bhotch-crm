# Job Counts Migration Instructions

## What This Migration Does

This migration restructures the Job Counts functionality by:

1. **Merges job_counts table INTO leads table** - All job count data becomes part of the lead record
2. **Migrates existing data** - All 21 existing job counts are transferred to their corresponding leads
3. **Removes the old job_counts table** - No more separate table for job counts
4. **New UI** - Job Counts tab now has a customer search/dropdown instead of a table view

## Before You Apply

**Current State:**
- 143 leads in database
- 21 job counts in separate job_counts table
- Job Counts tab shows table of all job counts

**After Migration:**
- 143 leads (with job count data embedded)
- No job_counts table
- Job Counts tab shows customer dropdown → select customer → view/edit their job count info

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `bhotch-crm`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Copy the Migration SQL

Open the file:
```
supabase/migrations/004_merge_job_counts_into_leads.sql
```

Copy the entire contents (lines 1-103)

### 3. Paste and Execute

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait for completion message

### 4. Verify Success

You should see a success message. To verify the migration worked:

```sql
-- Check that job count columns were added to leads
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN ('ridge_vents', 'turbine_vents', 'pipe_1_5_inch', 'gutter_lf');

-- Verify job_counts table was removed
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'job_counts';

-- Check that data was migrated (should show counts > 0 for some leads)
SELECT COUNT(*) as leads_with_sqft,
       COUNT(ridge_vents) as leads_with_ridge_vents,
       COUNT(gutter_lf) as leads_with_gutters
FROM leads
WHERE sqft IS NOT NULL;
```

Expected results:
- ✅ 4 columns found (ridge_vents, turbine_vents, pipe_1_5_inch, gutter_lf)
- ✅ No job_counts table found
- ✅ At least 21 leads with sqft data

### 5. Test the New UI

1. Refresh your browser (to reload the app with new schema)
2. Navigate to **Job Count** tab
3. You should see:
   - Customer search field
   - Customer dropdown (showing all 143 leads)
   - "Add New Count" button
4. Select a customer from the dropdown
5. Their job count information should display (if they have any)
6. Try editing and saving

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Restoring the job_counts table from backup
2. Re-running migration 001_initial_schema.sql (lines 70-114 for job_counts table)
3. Reverting code changes:
   ```bash
   git revert 199890df5
   ```

## New Job Counts Workflow

**Old Workflow:**
- Job Counts tab → Table of all job counts → Click row → View details

**New Workflow:**
- Job Counts tab → Search/select customer → View/edit their job count info
- OR click "Add New Count" → Enter customer info + job count data → Creates new lead

**Benefits:**
- Simpler data model (one table instead of two)
- No foreign key complexity
- Easier to understand (all customer data in one place)
- Customer-centric view (select customer first, then see their data)

## Troubleshooting

### Error: "column already exists"
This means the migration was partially applied. Check which columns exist:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'leads';
```
Then modify the migration to skip existing columns.

### Error: "job_counts table does not exist"
The table was already dropped. You can skip that part of the migration.

### Data not appearing in UI
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify data exists: `SELECT * FROM leads WHERE sqft IS NOT NULL LIMIT 5;`

## Questions?

Check:
- [supabase/migrations/004_merge_job_counts_into_leads.sql](supabase/migrations/004_merge_job_counts_into_leads.sql) - Migration SQL
- [src/features/jobcount/JobCountView.jsx](src/features/jobcount/JobCountView.jsx) - New UI component
- [src/hooks/useLeads.js](src/hooks/useLeads.js) - Updated data handling
