const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Required: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Column mapping from Google Sheets to Supabase
const LEAD_COLUMN_MAP = {
  'Date': 'date_added',
  'Customer Name': 'customer_name',
  'customerName': 'customer_name',
  'First Name': 'first_name',
  'firstName': 'first_name',
  'Last Name': 'last_name',
  'lastName': 'last_name',
  'Phone Number': 'phone_number',
  'phoneNumber': 'phone_number',
  'Email': 'email',
  'email': 'email',
  'Address': 'address',
  'address': 'address',
  'Latitude': 'latitude',
  'latitude': 'latitude',
  'Longitude': 'longitude',
  'longitude': 'longitude',
  'Quality': 'quality',
  'quality': 'quality',
  'Disposition': 'disposition',
  'disposition': 'disposition',
  'Lead Source': 'lead_source',
  'leadSource': 'lead_source',
  'Roof Age': 'roof_age',
  'roofAge': 'roof_age',
  'Roof Type': 'roof_type',
  'roofType': 'roof_type',
  'SQ FT': 'sqft',
  'sqFt': 'sqft',
  'Ridge LF': 'ridge_lf',
  'ridgeLf': 'ridge_lf',
  'Valley LF': 'valley_lf',
  'valleyLf': 'valley_lf',
  'Eaves LF': 'eaves_lf',
  'eavesLf': 'eaves_lf',
  'DaBella Quote': 'dabella_quote',
  'dabellaQuote': 'dabella_quote',
  'Notes': 'notes',
  'notes': 'notes'
};

const JOB_COUNT_COLUMN_MAP = {
  'Customer Name': 'customer_name',
  'customerName': 'customer_name',
  'Address': 'address',
  'address': 'address',
  'SQ FT': 'sqft',
  'sqFt': 'sqft',
  'Ridge LF': 'ridge_lf',
  'ridgeLf': 'ridge_lf',
  'Valley LF': 'valley_lf',
  'valleyLf': 'valley_lf',
  'Eaves LF': 'eaves_lf',
  'eavesLf': 'eaves_lf',
  'Ridge Vents': 'ridge_vents',
  'ridgeVents': 'ridge_vents',
  'Turbine': 'turbine_vents',
  'turbine': 'turbine_vents',
  'Rime Flow': 'rime_flow',
  'rimeFlow': 'rime_flow',
  '1.5"': 'pipe_1_5_inch',
  'pipe1_5': 'pipe_1_5_inch',
  '2"': 'pipe_2_inch',
  'pipe2': 'pipe_2_inch',
  '3"': 'pipe_3_inch',
  'pipe3': 'pipe_3_inch',
  '4"': 'pipe_4_inch',
  'pipe4': 'pipe_4_inch',
  'Gables': 'gables',
  'gables': 'gables',
  'Turtle Backs': 'turtle_backs',
  'turtleBacks': 'turtle_backs',
  'Satellite': 'satellite',
  'satellite': 'satellite',
  'Chimney': 'chimney',
  'chimney': 'chimney',
  'Solar': 'solar',
  'solar': 'solar',
  'Swamp Cooler': 'swamp_cooler',
  'swampCooler': 'swamp_cooler',
  'Gutters LF': 'gutter_lf',
  'guttersLf': 'gutter_lf',
  'Downspouts': 'downspouts',
  'downspouts': 'downspouts',
  'Gutter Guard LF': 'gutter_guard_lf',
  'gutterGuardLf': 'gutter_guard_lf',
  'Permanent Lighting': 'permanent_lighting',
  'permanentLighting': 'permanent_lighting',
  'Quote': 'quote_amount',
  'quote': 'quote_amount'
};

function transformLeadData(lead) {
  const transformed = {};

  Object.entries(LEAD_COLUMN_MAP).forEach(([oldKey, newKey]) => {
    const value = lead[oldKey];
    if (value === undefined) return;

    // Handle data type conversions
    if (newKey.includes('_lf') || newKey === 'sqft' || newKey === 'dabella_quote') {
      transformed[newKey] = value ? parseFloat(String(value).replace(/[$,]/g, '')) : null;
    } else if (newKey === 'latitude' || newKey === 'longitude') {
      transformed[newKey] = value ? parseFloat(value) : null;
    } else if (newKey === 'roof_age') {
      transformed[newKey] = value ? parseInt(value) : null;
    } else if (newKey === 'date_added') {
      transformed[newKey] = value || new Date().toISOString().split('T')[0];
    } else {
      transformed[newKey] = value || null;
    }
  });

  // Ensure customer_name exists
  if (!transformed.customer_name) {
    const firstName = transformed.first_name || '';
    const lastName = transformed.last_name || '';
    transformed.customer_name = `${firstName} ${lastName}`.trim() || 'Unknown';
  }

  return transformed;
}

function transformJobCountData(jobCount, leadMap) {
  const transformed = {};

  Object.entries(JOB_COUNT_COLUMN_MAP).forEach(([oldKey, newKey]) => {
    const value = jobCount[oldKey];
    if (value === undefined) return;

    // Handle data type conversions
    if (newKey.includes('_lf') || newKey === 'sqft' || newKey === 'quote_amount' || newKey === 'rime_flow') {
      transformed[newKey] = value ? parseFloat(String(value).replace(/[$,]/g, '')) : null;
    } else if (newKey.includes('_vents') || newKey === 'gables' || newKey === 'turtle_backs' || newKey === 'downspouts' || newKey.includes('pipe_')) {
      transformed[newKey] = value ? parseInt(value) : 0;
    } else if (newKey === 'satellite' || newKey === 'chimney' || newKey === 'solar' || newKey === 'swamp_cooler') {
      transformed[newKey] = value === 'Yes' || value === true || value === 'true';
    } else {
      transformed[newKey] = value || null;
    }
  });

  // Find matching lead ID
  const customerName = transformed.customer_name || jobCount.customerName || jobCount['Customer Name'];
  const address = transformed.address || jobCount.address || jobCount['Address'];

  if (customerName && address) {
    const key = `${customerName}|${address}`.toLowerCase();
    transformed.lead_id = leadMap.get(key);
  }

  return transformed;
}

async function migrateLeads() {
  console.log('📊 Starting leads migration...\n');

  const leadsFile = path.join(__dirname, '..', 'data-export', 'leads.json');
  if (!fs.existsSync(leadsFile)) {
    throw new Error('leads.json not found. Run export-sheets-data.js first.');
  }

  const leadsData = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  console.log(`Found ${leadsData.length} leads to migrate`);

  // Transform data to match new schema
  const transformedLeads = leadsData.map(transformLeadData).filter(lead => lead.customer_name);

  // Insert in batches of 100
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < transformedLeads.length; i += BATCH_SIZE) {
    const batch = transformedLeads.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('leads')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      errorCount += batch.length;
      errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
    } else {
      successCount += data.length;
      console.log(`✅ Migrated batch ${Math.floor(i / BATCH_SIZE) + 1} (${data.length} records)`);
    }
  }

  console.log(`\n📊 Leads Migration Summary:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${transformedLeads.length}`);

  return { successCount, errorCount, errors };
}

async function migrateJobCounts() {
  console.log('\n📊 Starting job counts migration...\n');

  const jobCountsFile = path.join(__dirname, '..', 'data-export', 'jobcounts.json');
  if (!fs.existsSync(jobCountsFile)) {
    console.log('⚠️  jobcounts.json not found. Skipping job counts migration.');
    return { successCount: 0, errorCount: 0 };
  }

  const jobCountsData = JSON.parse(fs.readFileSync(jobCountsFile, 'utf8'));
  console.log(`Found ${jobCountsData.length} job counts to migrate`);

  // First, create a mapping of customer names to lead IDs
  const { data: leads } = await supabase
    .from('leads')
    .select('id, customer_name, address');

  const leadMap = new Map();
  leads.forEach(lead => {
    const key = `${lead.customer_name}|${lead.address}`.toLowerCase();
    leadMap.set(key, lead.id);
  });

  // Transform job counts
  const transformedJobCounts = jobCountsData
    .map(jc => transformJobCountData(jc, leadMap))
    .filter(jc => jc.lead_id && jc.sqft); // Only include job counts with matching leads and sqft

  console.log(`Matched ${transformedJobCounts.length} job counts to leads`);

  if (transformedJobCounts.length === 0) {
    console.log('⚠️  No job counts matched to leads. Skipping insertion.');
    return { successCount: 0, errorCount: 0 };
  }

  // Insert job counts
  const { data, error } = await supabase
    .from('job_counts')
    .insert(transformedJobCounts);

  if (error) {
    console.error('❌ Job counts migration failed:', error.message);
    return { successCount: 0, errorCount: transformedJobCounts.length };
  }

  console.log(`✅ Migrated ${transformedJobCounts.length} job counts`);
  return { successCount: transformedJobCounts.length, errorCount: 0 };
}

async function validateMigration() {
  console.log('\n🔍 Validating migration...');

  // Count records in Supabase
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: jobCountsCount } = await supabase
    .from('job_counts')
    .select('*', { count: 'exact', head: true });

  // Compare with exported data
  const leadsFile = path.join(__dirname, '..', 'data-export', 'leads.json');
  const jobCountsFile = path.join(__dirname, '..', 'data-export', 'jobcounts.json');

  const exportedLeads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  const exportedJobCounts = fs.existsSync(jobCountsFile) ?
    JSON.parse(fs.readFileSync(jobCountsFile, 'utf8')) : [];

  console.log('\n📊 Validation Results:');
  console.log(`   Leads: ${leadsCount} / ${exportedLeads.length} ${leadsCount >= exportedLeads.length * 0.95 ? '✅' : '⚠️'}`);
  console.log(`   Job Counts: ${jobCountsCount} / ${exportedJobCounts.length} ${jobCountsCount >= exportedJobCounts.length * 0.9 ? '✅' : '⚠️'}`);

  return {
    leadsMatch: leadsCount >= exportedLeads.length * 0.95,
    jobCountsMatch: jobCountsCount >= exportedJobCounts.length * 0.9
  };
}

async function runMigration() {
  try {
    console.log('🚀 Bhotch CRM - Supabase Migration\n');
    console.log('==================================\n');

    // Check if data export exists
    const leadsFile = path.join(__dirname, '..', 'data-export', 'leads.json');
    if (!fs.existsSync(leadsFile)) {
      throw new Error('No export data found! Run export-sheets-data.js first.');
    }

    const leadsResult = await migrateLeads();
    const jobCountsResult = await migrateJobCounts();
    const validation = await validateMigration();

    console.log('\n🎉 Migration Complete!\n');
    console.log('==================================');
    console.log('📈 Summary:');
    console.log(`   Total Leads Migrated: ${leadsResult.successCount}`);
    console.log(`   Total Job Counts Migrated: ${jobCountsResult.successCount}`);
    console.log(`   Validation: ${validation.leadsMatch && validation.jobCountsMatch ? '✅ PASSED' : '⚠️  REVIEW NEEDED'}`);

    if (leadsResult.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      leadsResult.errors.forEach(err => {
        console.log(`   Batch ${err.batch}: ${err.error}`);
      });
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Verify data in Supabase Dashboard');
    console.log('   2. Update frontend code to use Supabase');
    console.log('   3. Test all CRM tabs');
    console.log('   4. Deploy to production');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

runMigration();
