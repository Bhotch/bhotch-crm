require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateJobCounts() {
  console.log('🔄 Starting Job Counts Migration to Supabase...\n');

  try {
    // Read job counts data
    const jobCountsPath = path.join(__dirname, '..', 'data-export', 'jobcounts.json');
    const jobCountsData = JSON.parse(fs.readFileSync(jobCountsPath, 'utf8'));

    console.log(`📊 Found ${jobCountsData.length} job counts to migrate\n`);

    // Get all existing leads to match against
    const { data: existingLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, customer_name, first_name, last_name, phone_number, address')
      .is('deleted_at', null);

    if (leadsError) throw leadsError;

    console.log(`📋 Found ${existingLeads.length} existing leads in database\n`);

    let matchedCount = 0;
    let createdLeadsCount = 0;
    let insertedJobCountsCount = 0;
    let skippedCount = 0;

    // Process each job count
    for (let i = 0; i < jobCountsData.length; i++) {
      const jc = jobCountsData[i];
      const customerName = jc.customerName || `${jc.firstName || ''} ${jc.lastName || ''}`.trim();

      console.log(`${i + 1}/${jobCountsData.length}: Processing "${customerName}"...`);

      // Try to find matching lead
      let leadId = null;

      // Match by full name
      const matchedLead = existingLeads.find(lead => {
        const leadName = lead.customer_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
        return leadName.toLowerCase() === customerName.toLowerCase();
      });

      if (matchedLead) {
        leadId = matchedLead.id;
        matchedCount++;
        console.log(`   ✅ Matched to existing lead: ${matchedLead.customer_name}`);
      } else {
        // Create new lead if no match found
        console.log(`   ⚠️  No match found, creating new lead...`);

        const newLeadData = {
          customer_name: customerName,
          first_name: jc.firstName || null,
          last_name: jc.lastName || null,
          phone_number: jc.phoneNumber || null,
          email: jc.email || null,
          address: jc.address || null,
          quality: jc.quality || 'Warm',
          disposition: jc.disposition || 'New',
          lead_source: 'Job Count Import',
          date_added: jc.date || jc.timestamp || new Date().toISOString()
        };

        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert([newLeadData])
          .select()
          .single();

        if (createError) {
          console.log(`   ❌ Error creating lead: ${createError.message}`);
          skippedCount++;
          continue;
        }

        leadId = newLead.id;
        existingLeads.push(newLead); // Add to list for future matches
        createdLeadsCount++;
        console.log(`   ✅ Created new lead with ID: ${leadId}`);
      }

      // Insert job count linked to lead
      // Note: Using correct column names from schema (no 'date' column, using created_at instead)
      const jobCountData = {
        lead_id: leadId,
        sqft: parseFloat(jc.sqFt) || 0, // Required field
        ridge_lf: parseFloat(jc.ridgeLf) || null,
        valley_lf: parseFloat(jc.valleyLf) || null,
        eaves_lf: parseFloat(jc.eavesLf) || null,
        ridge_vents: parseInt(jc.ridgeVents) || 0,
        turbine_vents: parseInt(jc.turbine) || 0, // Correct column name
        rime_flow: parseFloat(jc.rimeFlow) || null,
        // Note: high_profile_ridge_cap and valley_metal don't exist in schema
        pipe_1_5_inch: parseInt(jc.pipes1Half) || 0, // Correct column name
        pipe_2_inch: parseInt(jc.pipes2) || 0, // Correct column name
        pipe_3_inch: parseInt(jc.pipes3) || 0, // Correct column name
        pipe_4_inch: parseInt(jc.pipes4) || 0, // Correct column name
        gables: parseInt(jc.gables) || 0,
        turtle_backs: parseInt(jc.turtleBacks) || 0,
        satellite: Boolean(parseInt(jc.satellite)), // Boolean field
        chimney: Boolean(parseInt(jc.chimney)), // Boolean field
        solar: Boolean(parseInt(jc.solar)), // Boolean field
        swamp_cooler: Boolean(parseInt(jc.swampCooler)), // Boolean field
        gutter_lf: parseFloat(jc.guttersLf) || null, // Correct column name
        downspouts: parseInt(jc.downspouts) || 0,
        gutter_guard_lf: parseFloat(jc.gutterGuardLf) || null,
        permanent_lighting: jc.permanentLighting || null
      };

      const { error: insertError } = await supabase
        .from('job_counts')
        .insert([jobCountData]);

      if (insertError) {
        console.log(`   ❌ Error inserting job count: ${insertError.message}`);
        skippedCount++;
      } else {
        insertedJobCountsCount++;
        console.log(`   ✅ Job count inserted successfully`);
      }

      console.log('');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Job counts processed:     ${jobCountsData.length}`);
    console.log(`✅ Matched to existing leads: ${matchedCount}`);
    console.log(`✅ New leads created:        ${createdLeadsCount}`);
    console.log(`✅ Job counts inserted:      ${insertedJobCountsCount}`);
    console.log(`⚠️  Skipped (errors):        ${skippedCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify
    console.log('🔍 Verifying migration...\n');

    const { count: totalJobCounts, error: countError } = await supabase
      .from('job_counts')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (countError) throw countError;

    console.log(`📋 Total job counts in database: ${totalJobCounts}`);

    // Sample job counts with lead info
    const { data: sampleJobCounts, error: sampleError } = await supabase
      .from('job_counts')
      .select('*, leads(customer_name, address)')
      .is('deleted_at', null)
      .limit(5);

    if (sampleError) throw sampleError;

    console.log(`\n📊 Sample job counts with lead info:`);
    sampleJobCounts.forEach((jc, i) => {
      console.log(`   ${i + 1}. ${jc.leads?.customer_name || 'Unknown'} - ${jc.sqft} sq ft - ${jc.date}`);
    });

    console.log('\n🎉 Job counts migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

migrateJobCounts();
