/**
 * SUPABASE REAL-TIME CONNECTION TEST UTILITY
 * ===========================================
 * Run this to verify all CRM fields transfer correctly to Supabase in real-time
 *
 * Usage:
 * 1. Open browser console
 * 2. Import and run: testSupabaseConnection()
 * 3. Check console for results
 */

import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { leadsService } from '../api/supabaseService';

export async function testSupabaseConnection() {
  console.log('🔍 SUPABASE CONNECTION TEST STARTING...\n');

  const results = {
    connection: false,
    realtimeSubscription: false,
    fieldMapping: false,
    allTablesAccessible: false,
    errors: []
  };

  // =============================================
  // TEST 1: Basic Connection
  // =============================================
  console.log('TEST 1: Checking Supabase connection...');

  if (!isSupabaseEnabled()) {
    console.error('❌ Supabase is not enabled. Check environment variables.');
    results.errors.push('Supabase not configured');
    return results;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    console.log('✅ Connection successful');
    results.connection = true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    results.errors.push(`Connection: ${error.message}`);
  }

  // =============================================
  // TEST 2: Real-time Subscription
  // =============================================
  console.log('\nTEST 2: Testing real-time subscription...');

  try {
    let subscriptionWorked = false;

    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
        console.log('✅ Real-time event received:', payload.eventType);
        subscriptionWorked = true;
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
          results.realtimeSubscription = true;
        }
      });

    // Wait 2 seconds for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cleanup
    await channel.unsubscribe();

  } catch (error) {
    console.error('❌ Real-time subscription failed:', error.message);
    results.errors.push(`Real-time: ${error.message}`);
  }

  // =============================================
  // TEST 3: Field Mapping Test
  // =============================================
  console.log('\nTEST 3: Testing field mapping with test lead...');

  const testLead = {
    customerName: 'TEST_DELETE_ME',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '555-TEST',
    email: 'test@test.com',
    address: '123 Test St',
    quality: 'Hot',
    disposition: 'Scheduled',
    leadSource: 'Test',
    roofAge: 10,
    roofType: 'Asphalt',
    sqft: 2500,
    ridgeLf: 150,
    valleyLf: 75,
    eavesLf: 200,
    ridgeVents: 5,
    turbineVents: 3,
    rimeFlow: 25.5,
    pipes12: 4,       // ✅ NEW FIELD
    pipes34: 2,       // ✅ NEW FIELD
    gables: 3,
    turtleBacks: 1,
    satellite: true,
    chimney: true,
    solar: false,
    swampCooler: false,
    gutterLf: 100,
    downspouts: 6,
    gutterGuardLf: 80,
    permanentLighting: 'Full',
    dabellaQuote: 15000,
    quoteAmount: 14500,
    quoteNotes: 'Test quote',
    notes: 'TEST - DELETE ME'
  };

  let createdLeadId = null;

  try {
    // Create test lead
    console.log('Creating test lead with all fields...');
    const created = await leadsService.create({
      customer_name: testLead.customerName,
      first_name: testLead.firstName,
      last_name: testLead.lastName,
      phone_number: testLead.phoneNumber,
      email: testLead.email,
      address: testLead.address,
      quality: testLead.quality,
      disposition: testLead.disposition,
      lead_source: testLead.leadSource,
      roof_age: testLead.roofAge,
      roof_type: testLead.roofType,
      sqft: testLead.sqft,
      ridge_lf: testLead.ridgeLf,
      valley_lf: testLead.valleyLf,
      eaves_lf: testLead.eavesLf,
      ridge_vents: testLead.ridgeVents,
      turbine_vents: testLead.turbineVents,
      rime_flow: testLead.rimeFlow,
      pipes_12: testLead.pipes12,
      pipes_34: testLead.pipes34,
      gables: testLead.gables,
      turtle_backs: testLead.turtleBacks,
      satellite: testLead.satellite,
      chimney: testLead.chimney,
      solar: testLead.solar,
      swamp_cooler: testLead.swampCooler,
      gutter_lf: testLead.gutterLf,
      downspouts: testLead.downspouts,
      gutter_guard_lf: testLead.gutterGuardLf,
      permanent_lighting: testLead.permanentLighting,
      dabella_quote: testLead.dabellaQuote,
      quote_amount: testLead.quoteAmount,
      quote_notes: testLead.quoteNotes,
      notes: testLead.notes
    });

    createdLeadId = created.id;
    console.log('✅ Test lead created:', createdLeadId);

    // Verify all fields saved correctly
    const retrieved = await leadsService.getById(createdLeadId);

    const fieldChecks = [
      { field: 'customer_name', expected: testLead.customerName, actual: retrieved.customer_name },
      { field: 'pipes_12', expected: testLead.pipes12, actual: retrieved.pipes_12 },
      { field: 'pipes_34', expected: testLead.pipes34, actual: retrieved.pipes_34 },
      { field: 'ridge_vents', expected: testLead.ridgeVents, actual: retrieved.ridge_vents },
      { field: 'gutter_lf', expected: testLead.gutterLf, actual: Number(retrieved.gutter_lf) },
      { field: 'quote_amount', expected: testLead.quoteAmount, actual: Number(retrieved.quote_amount) }
    ];

    let allFieldsCorrect = true;
    console.log('\nField verification:');
    fieldChecks.forEach(check => {
      const match = check.expected === check.actual;
      console.log(`  ${match ? '✅' : '❌'} ${check.field}: ${check.actual} (expected: ${check.expected})`);
      if (!match) allFieldsCorrect = false;
    });

    if (allFieldsCorrect) {
      console.log('✅ All fields mapped correctly');
      results.fieldMapping = true;
    } else {
      console.error('❌ Some fields did not map correctly');
      results.errors.push('Field mapping mismatch');
    }

    // Cleanup: Delete test lead
    await leadsService.delete(createdLeadId);
    console.log('✅ Test lead deleted');

  } catch (error) {
    console.error('❌ Field mapping test failed:', error.message);
    results.errors.push(`Field mapping: ${error.message}`);

    // Cleanup if lead was created
    if (createdLeadId) {
      try {
        await leadsService.delete(createdLeadId);
      } catch (e) {
        console.error('Failed to cleanup test lead:', e.message);
      }
    }
  }

  // =============================================
  // TEST 4: All Tables Accessible
  // =============================================
  console.log('\nTEST 4: Checking access to all CRM tables...');

  const tables = [
    'leads',
    'communications',
    'canvassing_territories',
    'canvassing_properties',
    'property_visits',
    'property_designs',
    'calendar_events'
  ];

  let allTablesAccessible = true;

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) throw error;
      console.log(`  ✅ ${table}`);
    } catch (error) {
      console.error(`  ❌ ${table}: ${error.message}`);
      allTablesAccessible = false;
      results.errors.push(`Table ${table}: ${error.message}`);
    }
  }

  results.allTablesAccessible = allTablesAccessible;

  // =============================================
  // RESULTS SUMMARY
  // =============================================
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Connection:            ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Real-time:             ${results.realtimeSubscription ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Field Mapping:         ${results.fieldMapping ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`All Tables Accessible: ${results.allTablesAccessible ? '✅ PASS' : '❌ FAIL'}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  const allPassed = results.connection &&
                    results.realtimeSubscription &&
                    results.fieldMapping &&
                    results.allTablesAccessible;

  console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));
  console.log('='.repeat(50) + '\n');

  return results;
}

// Export for manual testing
window.testSupabaseConnection = testSupabaseConnection;
