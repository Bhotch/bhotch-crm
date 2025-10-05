-- =============================================
-- MIGRATION: Merge Job Counts into Leads Table
-- =============================================
-- This migration adds all job count columns to the leads table
-- and migrates existing job_counts data into the leads records.

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

-- Gutters & drainage (update existing gutters_lf to gutter_lf for consistency)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gutter_lf NUMERIC(10, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS downspouts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gutter_guard_lf NUMERIC(10, 2);

-- Lighting
ALTER TABLE leads ADD COLUMN IF NOT EXISTS permanent_lighting TEXT;

-- Quote information (already has dabella_quote, add job count quote fields)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_amount NUMERIC(12, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_notes TEXT;

-- Step 2: Migrate data from job_counts to leads
-- Update leads with their corresponding job_counts data
UPDATE leads l
SET
    -- Core measurements (these might already exist, update if job_counts has data)
    sqft = COALESCE(jc.sqft, l.sqft),
    ridge_lf = COALESCE(jc.ridge_lf, l.ridge_lf),
    valley_lf = COALESCE(jc.valley_lf, l.valley_lf),
    eaves_lf = COALESCE(jc.eaves_lf, l.eaves_lf),

    -- Ventilation details (new columns)
    ridge_vents = jc.ridge_vents,
    turbine_vents = jc.turbine_vents,
    rime_flow = jc.rime_flow,

    -- Pipe specifications (combined: 1"-2" and 3"-4")
    pipes_12 = COALESCE(jc.pipe_1_5_inch, 0) + COALESCE(jc.pipe_2_inch, 0),
    pipes_34 = COALESCE(jc.pipe_3_inch, 0) + COALESCE(jc.pipe_4_inch, 0),

    -- Roof features
    gables = jc.gables,
    turtle_backs = jc.turtle_backs,
    satellite = jc.satellite,
    chimney = jc.chimney,
    solar = jc.solar,
    swamp_cooler = jc.swamp_cooler,

    -- Gutters & drainage
    gutter_lf = jc.gutter_lf,
    downspouts = jc.downspouts,
    gutter_guard_lf = jc.gutter_guard_lf,

    -- Lighting
    permanent_lighting = jc.permanent_lighting,

    -- Quote information
    quote_amount = jc.quote_amount,
    quote_notes = jc.quote_notes
FROM job_counts jc
WHERE l.id = jc.lead_id;

-- Step 3: Drop old pipe columns with inconsistent naming
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_1_5;
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_2;
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_3;
ALTER TABLE leads DROP COLUMN IF EXISTS pipes_4;
ALTER TABLE leads DROP COLUMN IF EXISTS vents;
ALTER TABLE leads DROP COLUMN IF EXISTS gutters_lf;

-- Step 4: Drop the job_counts table and its dependencies
DROP TRIGGER IF EXISTS update_job_counts_updated_at ON job_counts;
DROP INDEX IF EXISTS idx_job_counts_lead_id;
DROP INDEX IF EXISTS idx_job_counts_created_at;
DROP TABLE IF EXISTS job_counts CASCADE;

-- Step 5: Update indexes for new columns
CREATE INDEX idx_leads_sqft ON leads(sqft) WHERE sqft IS NOT NULL;
CREATE INDEX idx_leads_quote_amount ON leads(quote_amount) WHERE quote_amount IS NOT NULL;

-- =============================================
-- VERIFICATION QUERIES (Run these manually to verify)
-- =============================================
-- SELECT COUNT(*) as total_leads,
--        COUNT(sqft) as leads_with_sqft,
--        COUNT(ridge_vents) as leads_with_ridge_vents,
--        COUNT(gutter_lf) as leads_with_gutters
-- FROM leads;
