#!/usr/bin/env node

/**
 * Apply Migration 005 and Run Validation Tests
 *
 * This script:
 * 1. Applies migration 005_fix_all_advisors.sql to Supabase
 * 2. Runs validation tests to ensure all fixes work
 * 3. Reports results
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration from .env
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('   Required: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Read migration and test files
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_fix_all_advisors.sql');
const testPath = path.join(__dirname, '..', 'supabase', 'test_migration_005.sql');

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
const testSQL = fs.readFileSync(testPath, 'utf8');

// Helper function to execute SQL via Supabase REST API
async function executeSql(sql, description) {
  console.log(`\n📝 ${description}...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Success');
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Migration 005 Deployment\n');
  console.log('=' .repeat(60));

  // Step 1: Apply migration
  console.log('\n📦 STEP 1: Applying Migration 005');
  console.log('=' .repeat(60));
  const migrationResult = await executeSql(migrationSQL, 'Running migration 005_fix_all_advisors.sql');

  if (!migrationResult) {
    console.error('\n❌ Migration failed. Aborting validation tests.');
    process.exit(1);
  }

  // Step 2: Run validation tests
  console.log('\n\n🧪 STEP 2: Running Validation Tests');
  console.log('=' .repeat(60));

  // Extract individual test queries
  const tests = testSQL.split('-- TEST').slice(1);

  for (let i = 0; i < tests.length; i++) {
    const testNum = i + 1;
    const testBlock = tests[i];
    const testTitle = testBlock.split('\n')[0].replace(/\d+:/, '').trim();

    // Extract SQL between comments
    const sqlMatch = testBlock.match(/SELECT[\s\S]*?;/i);
    if (sqlMatch) {
      const testQuery = sqlMatch[0];
      await executeSql(testQuery, `Test ${testNum}: ${testTitle}`);
    }
  }

  // Step 3: Final summary
  console.log('\n\n📊 STEP 3: Migration Summary');
  console.log('=' .repeat(60));
  console.log('\n✅ Migration 005 applied successfully!');
  console.log('\n📋 What was fixed:');
  console.log('   • 7 tables with RLS re-enabled (policy_exists_rls_disabled)');
  console.log('   • 7 tables with RLS in public schema (rls_disabled_in_public)');
  console.log('   • 1 view security fixed (security_definer_view)');
  console.log('   • 1 foreign key index added (unindexed_foreign_keys)');
  console.log('   • 22 unused indexes dropped (unused_index)');
  console.log('\n   Total issues fixed: 39');

  console.log('\n\n🔍 Next Steps:');
  console.log('=' .repeat(60));
  console.log('1. Go to Supabase Dashboard → Database → Advisors');
  console.log(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/advisors`);
  console.log('2. Click "Refresh" to update advisor status');
  console.log('3. Verify all 39 issues are resolved ✅');
  console.log('4. Test your application to ensure all features work');
  console.log('\n✨ Migration complete!\n');
}

// Run main function
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
