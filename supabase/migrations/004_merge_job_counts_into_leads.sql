-- =============================================
-- MIGRATION: Merge Job Counts into Leads Table
-- =============================================
-- This migration adds all job count columns to the leads table
-- Note: The job_counts table was already removed, so this just adds the columns

-- Step 1: Add job count columns to leads table
-- (Note: Some columns already exist like sqft, ridge_lf, valley_lf, eaves_lf)

-- Ventilation details
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ridge_vents INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS turbine_vents INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rime_flow NUMERIC(10, 2);

-- Pipe specifications (simplified to two fields)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipes_12 INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipes_34 INTEGER DEFAULT 0;

-- Roof features
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gables INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS turtle_backs INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS satellite BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chimney BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS solar BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS swamp_cooler BOOLEAN DEFAULT FALSE;

-- Gutters & drainage
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gutter_lf NUMERIC(10, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS downspouts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gutter_guard_lf NUMERIC(10, 2);

-- Lighting
ALTER TABLE leads ADD COLUMN IF NOT EXISTS permanent_lighting TEXT;

-- Quote information (already has dabella_quote, add job count quote fields)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_amount NUMERIC(12, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_notes TEXT;

-- Step 2: Drop old pipe columns with inconsistent naming (if they exist)
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_1_5;
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_2;
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_3;
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_4;
ALTER TABLE leads DROP COLUMN IF EXISTS vents;
ALTER TABLE leads DROP COLUMN IF EXISTS gutters_lf;

-- Step 3: Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_sqft ON leads(sqft) WHERE sqft IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_quote_amount ON leads(quote_amount) WHERE quote_amount IS NOT NULL;

-- =============================================
-- VERIFICATION QUERIES (Run these manually to verify)
-- =============================================
-- Check that new columns were added:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'leads'
-- AND column_name IN ('ridge_vents', 'turbine_vents', 'pipes_12', 'pipes_34', 'gutter_lf', 'quote_amount');

-- Check leads with job count data:
-- SELECT COUNT(*) as total_leads,
--        COUNT(sqft) as leads_with_sqft,
--        COUNT(ridge_vents) as leads_with_ridge_vents,
--        COUNT(gutter_lf) as leads_with_gutters
-- FROM leads;
