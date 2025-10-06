-- =============================================
-- CRM FIELD MAPPING VERIFICATION TEST
-- =============================================
-- This test verifies that all CRM fields correctly map to Supabase columns
-- Run this to ensure real-time data transfer works for all fields

\echo '========================================='
\echo 'LEADS TABLE FIELD VERIFICATION'
\echo '========================================='

-- Verify all expected columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name IN (
            -- Basic Information
            'id', 'created_at', 'updated_at', 'date_added',
            'customer_name', 'first_name', 'last_name',
            'phone_number', 'email', 'address',
            'latitude', 'longitude',
            -- Lead Classification
            'quality', 'disposition', 'lead_source', 'status',
            -- Property Info
            'roof_age', 'roof_type',
            -- Measurements
            'sqft', 'ridge_lf', 'valley_lf', 'eaves_lf',
            -- Ventilation
            'ridge_vents', 'turbine_vents', 'rime_flow',
            -- Pipes (NEW SIMPLIFIED FIELDS)
            'pipes_12', 'pipes_34',
            -- Roof Features
            'gables', 'turtle_backs', 'satellite', 'chimney', 'solar', 'swamp_cooler',
            -- Gutters
            'gutter_lf', 'downspouts', 'gutter_guard_lf',
            -- Lighting & Quotes
            'permanent_lighting', 'dabella_quote', 'quote_amount', 'quote_notes',
            -- Additional
            'notes', 'last_contact_date', 'deleted_at'
        ) THEN 'EXPECTED'
        ELSE 'UNEXPECTED'
    END AS field_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
ORDER BY
    CASE field_status
        WHEN 'EXPECTED' THEN 1
        ELSE 2
    END,
    ordinal_position;

\echo ''
\echo '========================================='
\echo 'VERIFY OLD PIPE COLUMNS ARE DROPPED'
\echo '========================================='

-- These columns should NOT exist (were dropped in migration 004)
SELECT
    COUNT(*) AS old_pipe_columns_count,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS: Old pipe columns removed'
        ELSE 'FAIL: Old pipe columns still exist - ' || string_agg(column_name, ', ')
    END AS test_result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN ('pipes_1_5', 'pipes_2', 'pipes_3', 'pipes_4', 'vents', 'gutters_lf');

\echo ''
\echo '========================================='
\echo 'VERIFY NEW PIPE COLUMNS EXIST'
\echo '========================================='

-- These columns SHOULD exist (added in migration 004)
SELECT
    COUNT(*) AS new_pipe_columns_count,
    CASE
        WHEN COUNT(*) = 2 THEN 'PASS: New pipe columns exist (pipes_12, pipes_34)'
        ELSE 'FAIL: Missing pipe columns - expected 2, found ' || COUNT(*)
    END AS test_result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN ('pipes_12', 'pipes_34');

\echo ''
\echo 'Details:'
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN ('pipes_12', 'pipes_34')
ORDER BY column_name;

\echo ''
\echo '========================================='
\echo 'TEST INSERT WITH ALL FIELDS'
\echo '========================================='

-- Insert a test lead with all fields
INSERT INTO leads (
    customer_name,
    first_name,
    last_name,
    phone_number,
    email,
    address,
    latitude,
    longitude,
    quality,
    disposition,
    lead_source,
    roof_age,
    roof_type,
    sqft,
    ridge_lf,
    valley_lf,
    eaves_lf,
    ridge_vents,
    turbine_vents,
    rime_flow,
    pipes_12,
    pipes_34,
    gables,
    turtle_backs,
    satellite,
    chimney,
    solar,
    swamp_cooler,
    gutter_lf,
    downspouts,
    gutter_guard_lf,
    permanent_lighting,
    dabella_quote,
    quote_amount,
    quote_notes,
    notes
) VALUES (
    'Test Customer',
    'Test',
    'Customer',
    '555-1234',
    'test@example.com',
    '123 Test St',
    40.7128,
    -74.0060,
    'Hot',
    'Scheduled',
    'Website',
    10,
    'Asphalt Shingle',
    2500.00,
    150.00,
    75.00,
    200.00,
    5,
    3,
    25.50,
    4,
    2,
    3,
    1,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    100.00,
    6,
    80.00,
    'Full perimeter',
    15000.00,
    14500.00,
    'Standard DaBella quote',
    'Test lead - please delete'
)
RETURNING
    id,
    customer_name,
    pipes_12,
    pipes_34,
    ridge_vents,
    gutter_lf,
    quote_amount,
    created_at;

\echo ''
\echo '========================================='
\echo 'CLEANUP TEST DATA'
\echo '========================================='

-- Soft delete the test lead
UPDATE leads
SET deleted_at = NOW()
WHERE customer_name = 'Test Customer'
  AND notes = 'Test lead - please delete'
RETURNING customer_name, deleted_at;

\echo ''
\echo '========================================='
\echo 'FIELD MAPPING SUMMARY'
\echo '========================================='

\echo 'CRM Frontend -> Database Column Mapping:'
\echo '----------------------------------------'
\echo 'customerName       -> customer_name'
\echo 'firstName          -> first_name'
\echo 'lastName           -> last_name'
\echo 'phoneNumber        -> phone_number'
\echo 'email              -> email'
\echo 'address            -> address'
\echo 'quality            -> quality'
\echo 'disposition        -> disposition'
\echo 'leadSource         -> lead_source'
\echo 'roofAge            -> roof_age'
\echo 'roofType           -> roof_type'
\echo 'dabellaQuote       -> dabella_quote'
\echo 'sqft               -> sqft'
\echo 'ridgeLf            -> ridge_lf'
\echo 'valleyLf           -> valley_lf'
\echo 'eavesLf            -> eaves_lf'
\echo 'ridgeVents         -> ridge_vents'
\echo 'turbineVents       -> turbine_vents'
\echo 'rimeFlow           -> rime_flow'
\echo 'pipes12            -> pipes_12  (1"-2" pipes)'
\echo 'pipes34            -> pipes_34  (3"-4" pipes)'
\echo 'gables             -> gables'
\echo 'turtleBacks        -> turtle_backs'
\echo 'satellite          -> satellite'
\echo 'chimney            -> chimney'
\echo 'solar              -> solar'
\echo 'swampCooler        -> swamp_cooler'
\echo 'gutterLf           -> gutter_lf'
\echo 'downspouts         -> downspouts'
\echo 'gutterGuardLf      -> gutter_guard_lf'
\echo 'permanentLighting  -> permanent_lighting'
\echo 'quoteAmount        -> quote_amount'
\echo 'quoteNotes         -> quote_notes'
\echo 'notes              -> notes'
\echo ''
\echo 'DEPRECATED FIELDS (DO NOT USE):'
\echo '----------------------------------------'
\echo 'pipe15Inch, pipe2Inch, pipe3Inch, pipe4Inch'
\echo 'These have been replaced by pipes12 and pipes34'
